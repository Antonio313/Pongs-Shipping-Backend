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
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});