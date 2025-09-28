const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = {
  // Find user by email
  findByEmail: async (email) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find user by verification token
  findByVerificationToken: async (token) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()',
        [token]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find user by ID
  findById: async (id) => {
    try {
      const result = await pool.query(
        'SELECT user_id, first_name, last_name, email, phone, address, address_data, branch, role, is_verified, created_at FROM users WHERE user_id = $1',
        [id]
      );
      const user = result.rows[0];
      if (user && user.address_data) {
        try {
          user.address_data = JSON.parse(user.address_data);
        } catch (e) {
          console.warn('Failed to parse address_data for user:', id);
          user.address_data = null;
        }
      }
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Create a new user
  create: async (userData) => {
    const { first_name, last_name, email, password, phone, branch, role } = userData;

    // Basic validation
    if (!email || !password || !first_name || !last_name) {
      throw new Error('Missing required fields');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Password strength validation
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    try {
      // Hash the password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      console.log('Generated verification token:', verificationToken);
      console.log('Token expires:', verificationTokenExpires);
      
      // Insert user with ALL fields including verification data
      const result = await pool.query(
        `INSERT INTO users 
        (first_name, last_name, email, password_hash, phone, branch, role, 
          verification_token, verification_token_expires, is_verified) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING user_id, first_name, last_name, email, phone, branch, role, 
                  is_verified, verification_token, verification_token_expires, created_at`,
        [first_name, last_name, email, hashedPassword, phone, branch, role || 'C', 
        verificationToken, verificationTokenExpires, false] // is_verified is false initially
      );
      
      const newUser = result.rows[0];
      console.log('User created with ID:', newUser.user_id);
      console.log('Stored verification token:', newUser.verification_token);
      console.log('Stored token expiration:', newUser.verification_token_expires);
      
      // Generate the complete formatted address structure
      const paddedUserId = newUser.user_id < 10 ? `0${newUser.user_id}` : `${newUser.user_id}`;
      const addressLine1 = '3132 NW 43rd Street';
      const addressLine2 = `PSC ${branch} ${paddedUserId}`;
      const city = 'Lauderdale Lakes';
      const state = 'Florida';
      const zipCode = '33309';

      // Store complete address as JSON object for flexibility
      const addressData = {
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city: city,
        state: state,
        zip_code: zipCode,
        formatted: `${addressLine1}, ${addressLine2}, ${city}, ${state} ${zipCode}`
      };

      // Update the user with the formatted address data
      await pool.query(
        'UPDATE users SET address = $1, address_data = $2 WHERE user_id = $3',
        [addressData.formatted, JSON.stringify(addressData), newUser.user_id]
      );
      
      // Return the user with all data including verification token
      return {
        ...newUser,
        address: addressData.formatted,
        address_data: addressData,
        verification_token: verificationToken // Return the original token for email
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      console.log('Verifying token:', token);
      
      // First check if token exists and is not expired
      const checkResult = await pool.query(
        'SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()',
        [token]
      );
      
      if (checkResult.rows.length === 0) {
        console.log('Token not found or expired');
        return null;
      }
      
      console.log('Token is valid, updating user verification status');
      
      // Update the user verification status
      const result = await pool.query(
        `UPDATE users 
        SET is_verified = TRUE, 
            verification_token = NULL, 
            verification_token_expires = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE verification_token = $1
        RETURNING user_id, email, first_name, last_name`,
        [token]
      );
      
      console.log('Update successful, affected rows:', result.rowCount);
      
      if (result.rows.length === 0) {
        console.log('No rows updated - token might have been used already');
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      throw error;
    }
  },

  // Add this method to your User model
  findByVerificationTokenWithStatus: async (token) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE verification_token = $1',
        [token]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Resend verification email
  regenerateVerificationToken: async (email) => {
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const result = await pool.query(
        `UPDATE users 
         SET verification_token = $1, 
             verification_token_expires = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = $3
         RETURNING user_id, email, first_name, last_name, verification_token`,
        [verificationToken, verificationTokenExpires, email]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Verify password
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = User;