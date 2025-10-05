const pool = require('../config/database');

const PreAlert = {
  // Find all prealerts for a user
  findByUserId: async (userId) => {
    try {
      const result = await pool.query(
        `SELECT pa.*, p.tracking_number as package_tracking_number, p.status as package_status
         FROM prealerts pa
         LEFT JOIN packages p ON pa.package_id = p.package_id
         WHERE pa.user_id = $1
         ORDER BY pa.created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Find prealert by ID
  findById: async (prealertId) => {
    try {
      const result = await pool.query(
        `SELECT pa.*, p.tracking_number as package_tracking_number, p.status as package_status,
                u.first_name, u.last_name, u.email
         FROM prealerts pa
         LEFT JOIN packages p ON pa.package_id = p.package_id
         LEFT JOIN users u ON pa.user_id = u.user_id
         WHERE pa.prealert_id = $1`,
        [prealertId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find prealert by status
  findByStatus: async (status) => {
    try {
      const result = await pool.query(
        `SELECT pa.*, p.tracking_number as package_tracking_number, p.status as package_status,
                u.first_name, u.last_name, u.email
         FROM prealerts pa
         LEFT JOIN packages p ON pa.package_id = p.package_id
         LEFT JOIN users u ON pa.user_id = u.user_id
         WHERE pa.status = $1
         ORDER BY pa.created_at DESC`,
        [status]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Create a new prealert

  create: async (prealertData) => {
    const { user_id, description, price, invoice_url, s3_key, status, tracking_number, carrier } = prealertData;

    // More specific validation
    if (!user_id) {
      throw new Error('User ID is required');
    }

    if (!description || !description.trim()) {
      throw new Error('Description is required');
    }

    try {
      const result = await pool.query(
        `INSERT INTO prealerts
        (user_id, description, price, invoice_url, s3_key, status, tracking_number, carrier)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [user_id, description.trim(), price || 0, invoice_url || null, s3_key || null, status || 'U', tracking_number || null, carrier || null]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating prealert:', error);
      throw error;
    }
  },

  // Update prealert
  update: async (prealertId, prealertData) => {
    const { description, price, invoice_url, s3_key, status, package_id, tracking_number, carrier } = prealertData;

    try {
      const result = await pool.query(
        `UPDATE prealerts
         SET description = COALESCE($1, description),
             price = COALESCE($2, price),
             invoice_url = COALESCE($3, invoice_url),
             s3_key = COALESCE($4, s3_key),
             status = COALESCE($5, status),
             package_id = COALESCE($6, package_id),
             tracking_number = COALESCE($7, tracking_number),
             carrier = COALESCE($8, carrier),
             updated_at = CURRENT_TIMESTAMP
         WHERE prealert_id = $9
         RETURNING *`,
        [description, price, invoice_url, s3_key, status, package_id, tracking_number, carrier, prealertId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating prealert:', error);
      throw error;
    }
  },

  // Confirm prealert (link to package)
  confirmPrealert: async (prealertId, packageId) => {
    try {
      const result = await pool.query(
        `UPDATE prealerts 
         SET status = 'C',
             package_id = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE prealert_id = $2
         RETURNING *`,
        [packageId, prealertId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error confirming prealert:', error);
      throw error;
    }
  },

  // Delete prealert
  delete: async (prealertId) => {
    try {
      const result = await pool.query(
        'DELETE FROM prealerts WHERE prealert_id = $1 RETURNING *',
        [prealertId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting prealert:', error);
      throw error;
    }
  },

  // Get all prealerts (for admin)
  findAll: async () => {
    try {
      const result = await pool.query(
        `SELECT pa.*, p.tracking_number as package_tracking_number, p.status as package_status,
                u.first_name, u.last_name, u.email, u.branch
         FROM prealerts pa
         LEFT JOIN packages p ON pa.package_id = p.package_id
         LEFT JOIN users u ON pa.user_id = u.user_id
         ORDER BY pa.created_at DESC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Find prealerts by user ID with package information
  findByUserIdWithPackages: async (userId) => {
    try {
      const result = await pool.query(
        `SELECT pa.*, p.tracking_number as package_tracking_number, p.status as package_status, p.weight, p.cost as package_cost
        FROM prealerts pa
        LEFT JOIN packages p ON pa.package_id = p.package_id
        WHERE pa.user_id = $1
        ORDER BY pa.created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};


module.exports = PreAlert;