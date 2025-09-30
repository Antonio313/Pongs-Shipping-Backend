const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const pool = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, branch, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const newUser = await User.create({
      first_name,
      last_name,
      email,
      password,
      phone,
      branch,
      role
    });
    
    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${newUser.verification_token}`;
    const emailSent = await sendEmail(
      newUser.email,
      emailTemplates.verification(newUser.first_name, verificationLink).subject,
      emailTemplates.verification(newUser.first_name, verificationLink).html
    );
    
    if (!emailSent) {
      console.warn('Verification email could not be sent to:', newUser.email);
    }
    
    // Generate JWT token (with limited permissions until verified)
    // Registration tokens are short-lived until verified
    const token = jwt.sign(
      {
        userId: newUser.user_id,
        email: newUser.email,
        role: newUser.role,
        isVerified: false
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Short-lived until verified
    );
    
    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        user_id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        branch: newUser.branch,
        role: newUser.role,
        is_verified: false,
        created_at: newUser.created_at
      },
      token,
      requires_verification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Verify Email Route
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    const user = await User.verifyEmail(token);
    
    if (!user) {
      // Check if the user might already be verified
      // Look for any user that had this token (even if it's now cleared)
      const usersWithThisToken = await pool.query(
        'SELECT * FROM users WHERE verification_token = $1 OR verification_token IS NULL',
        [token]
      );
      
      // If we find a user and they're already verified, return success
      if (usersWithThisToken.rows.length > 0 && usersWithThisToken.rows[0].is_verified) {
        return res.status(200).json({
          message: 'Email was already verified successfully',
          user: {
            user_id: usersWithThisToken.rows[0].user_id,
            email: usersWithThisToken.rows[0].email,
            first_name: usersWithThisToken.rows[0].first_name,
            last_name: usersWithThisToken.rows[0].last_name
          }
        });
      }
      
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    res.status(200).json({ 
      message: 'Email verified successfully',
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
});

// Resend Verification Email Route
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.is_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Regenerate verification token
    const updatedUser = await User.regenerateVerificationToken(email);
    
    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${updatedUser.verification_token}`;
    const emailSent = await sendEmail(
      updatedUser.email,
      emailTemplates.verification(updatedUser.first_name, verificationLink).subject,
      emailTemplates.verification(updatedUser.first_name, verificationLink).html
    );
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }
    
    res.status(200).json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Error resending verification email', error: error.message });
  }
});

// Login Route (updated to check verification status)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        requires_verification: true,
        email: user.email
      });
    }
    
    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token with role-based expiration
    // Customer (C): 4 hours, Admin (A): 12 hours, Others: 8 hours
    let tokenExpiry;
    switch (user.role) {
      case 'C': // Customer
        tokenExpiry = '4h';
        break;
      case 'A': // Admin
        tokenExpiry = '12h';
        break;
      default: // Staff and others
        tokenExpiry = '8h';
        break;
    }

    console.log(`Generating token for user ${user.email} with role ${user.role}, expiry: ${tokenExpiry}`);

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        branch: user.branch,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});


// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    
    await pool.query(
      `UPDATE users 
       SET reset_password_token = $1, 
           reset_password_expires = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [resetToken, resetTokenExpires, user.user_id]
    );
    
    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const emailSent = await sendEmail(
      user.email,
      'Reset Your Password - Pongs Shipping Company',
      `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.first_name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    );
    
    res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Find user with valid reset token
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    const user = result.rows[0];
    
    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           reset_password_token = NULL,
           reset_password_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [hashedPassword, user.user_id]
    );
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Validate Token Route
router.post('/validate-token', authenticateToken, async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticateToken middleware passed)
    // req.user is already the full user object from the database (set by authenticateToken middleware)
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ message: 'User email not verified' });
    }

    res.status(200).json({
      message: 'Token is valid',
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;