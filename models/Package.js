const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Package = {
  // Find all packages for a user
  findByUserId: async (userId) => {
    try {
      const result = await pool.query(
        `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.customer_number
         FROM packages p
         JOIN users u ON p.user_id = u.user_id
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Find package by ID
  findById: async (packageId) => {
    try {
      const result = await pool.query(
        `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.address, u.branch, u.customer_number
         FROM packages p
         JOIN users u ON p.user_id = u.user_id
         WHERE p.package_id = $1`,
        [packageId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find package by tracking number
  findByTrackingNumber: async (trackingNumber) => {
    try {
      const result = await pool.query(
        `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.address, u.branch, u.customer_number
         FROM packages p
         JOIN users u ON p.user_id = u.user_id
         WHERE p.tracking_number = $1`,
        [trackingNumber]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create a new package
  create: async (packageData) => {
    const { user_id, description, weight, length, width, height, cost, status } = packageData;

    // Basic validation
    if (!user_id || !description || !weight || !cost) {
      throw new Error('User ID, description, weight, and cost are required');
    }

    try {
      // Generate package ID and tracking number
      const package_id = `PKG${Date.now().toString().slice(-6)}`;
      const tracking_number = `TRK${uuidv4().slice(0, 8).toUpperCase()}`;

      const result = await pool.query(
        `INSERT INTO packages 
         (package_id, user_id, tracking_number, description, weight, length, width, height, cost, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [package_id, user_id, tracking_number, description, weight, length, width, height, cost, status || 'Processing']
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating package:', error);
      throw error;
    }
  },

  // Update package
  update: async (packageId, packageData) => {
    const { description, weight, length, width, height, cost, status } = packageData;
    
    try {
      const result = await pool.query(
        `UPDATE packages 
         SET description = COALESCE($1, description),
             weight = COALESCE($2, weight),
             length = COALESCE($3, length),
             width = COALESCE($4, width),
             height = COALESCE($5, height),
             cost = COALESCE($6, cost),
             status = COALESCE($7, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE package_id = $8
         RETURNING *`,
        [description, weight, length, width, height, cost, status, packageId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  },

  // Update package status
  updateStatus: async (packageId, status, location, notes, created_by) => {
    try {
      const result = await pool.query(
        `UPDATE packages 
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE package_id = $2
         RETURNING *`,
        [status, packageId]
      );

      // Also add to package tracking
      if (result.rows[0]) {
        await pool.query(
          `INSERT INTO packagetracking 
           (package_id, location, status, notes, created_by) 
           VALUES ($1, $2, $3, $4, $5)`,
          [packageId, location, status, notes, created_by]
        );
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating package status:', error);
      throw error;
    }
  },

  // Delete package
  delete: async (packageId) => {
    try {
      const result = await pool.query(
        'DELETE FROM packages WHERE package_id = $1 RETURNING *',
        [packageId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting package:', error);
      throw error;
    }
  },

  // Get all packages (for admin)
  findAll: async (filters = {}) => {
    try {
      let query = `
        SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.branch, u.customer_number
        FROM packages p
        JOIN users u ON p.user_id = u.user_id
      `;
      
      const values = [];
      const conditions = [];
      
      if (filters.status) {
        values.push(filters.status);
        conditions.push(`p.status = $${values.length}`);
      }
      
      if (filters.branch) {
        values.push(filters.branch);
        conditions.push(`u.branch = $${values.length}`);
      }
      
      if (filters.user_id) {
        values.push(filters.user_id);
        conditions.push(`p.user_id = $${values.length}`);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ' ORDER BY p.created_at DESC';
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get packages by status
  findByStatus: async (status) => {
    try {
      const result = await pool.query(
        `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.branch
         FROM packages p
         JOIN users u ON p.user_id = u.user_id
         WHERE p.status = $1
         ORDER BY p.created_at DESC`,
        [status]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Package;