const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ Auth middleware: No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Auth middleware: Token decoded successfully', { userId: decoded.userId, email: decoded.email, role: decoded.role });

    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log('❌ Auth middleware: User not found in database for userId:', decoded.userId);
      return res.status(403).json({ message: 'Invalid token - user not found' });
    }

    console.log('✅ Auth middleware: User found', { user_id: user.user_id, email: user.email, role: user.role });
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Auth middleware: Token verification failed', error.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware that requires verified users
const authenticateTokenRequireVerified = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Check if user is verified for routes that require verification
    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Please verify your email to access this resource',
        requires_verification: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Optional middleware for routes that can be accessed by unverified users
const authenticateTokenOptionalVerification = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken,
  authenticateTokenRequireVerified,
  authenticateTokenOptionalVerification
};