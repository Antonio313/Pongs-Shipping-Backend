const { Pool } = require('pg');
require('dotenv').config();

// Environment-aware database configuration
// Supports both Railway's DATABASE_URL format and individual environment variables
let poolConfig;

if (process.env.DATABASE_URL) {
  // Railway production format
  console.log('🔧 Using DATABASE_URL for database connection');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
} else {
  // Local development format
  console.log('🔧 Using individual environment variables for database connection');
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  };
}

const pool = new Pool(poolConfig);

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = pool;