require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const prealertsRoutes = require('./routes/prealerts');
const packagesRoutes = require('./routes/packages');
const adminRoutes = require('./routes/admin');
const deliveriesRoutes = require('./routes/deliveries');
const customerRoutes = require('./routes/customer');
const transfersRoutes = require('./routes/transfers');
const superAdminRoutes = require('./routes/superAdmin');


// Import email config to initialize it
require('./config/email');

const app = express();

// Middleware
app.use(express.json());

// Dynamic CORS configuration for Railway deployment flexibility
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Local development alternative
  'http://localhost:3001', // Local development alternative
];

// Add production origins
if (process.env.NODE_ENV === 'production') {
  // Add specific frontend URL if provided
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  // Add Railway pattern URLs
  allowedOrigins.push(/^https:\/\/.*\.up\.railway\.app$/);
  allowedOrigins.push(/^https:\/\/.*\.railway\.app$/);
}

console.log('🔧 CORS Configuration:');
console.log('  Allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prealerts', prealertsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Email test endpoint (for debugging)
app.get('/api/test-email', async (req, res) => {
  try {
    const { testEmail } = require('./config/email');
    const testTo = req.query.email || 'reuelrichards1@gmail.com';

    console.log('🧪 Testing email via API endpoint...');
    const result = await testEmail(testTo);

    res.status(200).json({
      success: result,
      message: result ? 'Test email sent successfully' : 'Test email failed',
      sentTo: testTo
    });
  } catch (error) {
    console.error('Email test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});