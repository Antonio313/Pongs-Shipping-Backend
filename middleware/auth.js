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
 

    const user = await User.findById(decoded.userId);

    if (!user) {

      return res.status(403).json({ message: 'Invalid token - user not found' });
    }

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

// Role-based middleware - checks if user has any of the allowed roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Auth middleware: User role '${req.user.role}' not in allowed roles:`, allowedRoles);
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.',
        required_role: allowedRoles
      });
    }

    console.log(`✅ Auth middleware: User role '${req.user.role}' authorized`);
    next();
  };
};

// Middleware for admin-only routes (Super Admin, Admin, and staff with admin permissions)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const adminRoles = ['S', 'A', 'H', 'T', 'D', 'F']; // Super Admin, Admin, and all staff roles
  if (!adminRoles.includes(req.user.role)) {
    console.log(`❌ Auth middleware: User role '${req.user.role}' is not an admin/staff role`);
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }

  console.log(`✅ Auth middleware: Admin/staff access granted for role '${req.user.role}'`);
  next();
};

// Middleware for super admin only routes
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'S') {
    console.log(`❌ Auth middleware: User role '${req.user.role}' is not Super Admin`);
    return res.status(403).json({ message: 'Access denied. Super Admin access required.' });
  }

  console.log('✅ Auth middleware: Super Admin access granted');
  next();
};

module.exports = {
  authenticateToken,
  authenticateTokenRequireVerified,
  authenticateTokenOptionalVerification,
  requireRole,
  requireAdmin,
  requireSuperAdmin
};