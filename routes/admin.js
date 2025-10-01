// Add to your auth.js or create a new admin.js route file
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all customers (for admin dashboard)
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.address, u.branch, 
              u.is_verified, u.created_at,
              COUNT(p.prealert_id) as prealert_count
       FROM users u
       LEFT JOIN prealerts p ON u.user_id = p.user_id
       WHERE u.role = 'C' 
       GROUP BY u.user_id
       ORDER BY u.created_at DESC`
    );
    
    res.status(200).json({ customers: result.rows });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

// Get a specific customer with their pre-alerts
router.get('/customers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {

    const { id } = req.params;
    
    // Get customer details
    const customerResult = await pool.query(
      `SELECT user_id, first_name, last_name, email, phone, address, branch, 
              is_verified, created_at 
       FROM users 
       WHERE user_id = $1 AND role = 'C'`,
      [id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Get customer's pre-alerts
    const preAlertsResult = await pool.query(
      `SELECT prealert_id, user_id, description, price, invoice_url, status, created_at
       FROM prealerts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );
    
    res.status(200).json({
      customer: customerResult.rows[0],
      preAlerts: preAlertsResult.rows
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ message: 'Error fetching customer details', error: error.message });
  }
});

// Get admin profile statistics
router.get('/profile/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {

    const adminId = req.user.user_id;

    // Get delivery stats
    const deliveryStatsQuery = `
      SELECT
        COUNT(*) as deliveries_count,
        COALESCE(SUM(p.finalcost), 0) as total_amount_handled,
        MAX(d.delivered_at) as last_delivery
      FROM Deliveries d
      JOIN Packages p ON d.package_id = p.package_id
      WHERE d.delivered_by = $1
    `;

    const deliveryStatsResult = await pool.query(deliveryStatsQuery, [adminId]);
    const deliveryStats = deliveryStatsResult.rows[0];

    // Get packages processed count (all packages - since schema doesn't have created_by/updated_by for packages)
    const packagesProcessedQuery = `
      SELECT COUNT(*) as packages_processed
      FROM PackageTracking pt
      WHERE pt.created_by = $1
    `;

    const packagesProcessedResult = await pool.query(packagesProcessedQuery, [adminId]);
    const packagesProcessed = packagesProcessedResult.rows[0].packages_processed || 0;

    // Get unique customers served through deliveries
    const customersServedQuery = `
      SELECT COUNT(DISTINCT p.user_id) as customers_served
      FROM Deliveries d
      JOIN Packages p ON d.package_id = p.package_id
      WHERE d.delivered_by = $1
    `;

    const customersServedResult = await pool.query(customersServedQuery, [adminId]);
    const customersServed = customersServedResult.rows[0].customers_served || 0;

    // Get total packages handled by this admin (through tracking updates)
    const totalPackagesQuery = `
      SELECT COUNT(DISTINCT pt.package_id) as total_packages_handled
      FROM PackageTracking pt
      WHERE pt.created_by = $1
    `;

    const totalPackagesResult = await pool.query(totalPackagesQuery, [adminId]);
    const totalPackagesHandled = totalPackagesResult.rows[0].total_packages_handled || 0;

    const stats = {
      deliveries_count: parseInt(deliveryStats.deliveries_count) || 0,
      total_amount_handled: parseFloat(deliveryStats.total_amount_handled) || 0,
      packages_processed: parseInt(packagesProcessed) || 0,
      customers_served: parseInt(customersServed) || 0,
      total_packages_handled: parseInt(totalPackagesHandled) || 0,
      last_delivery: deliveryStats.last_delivery
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching admin profile stats:', error);
    res.status(500).json({ message: 'Failed to fetch profile statistics' });
  }
});

// Update admin profile information
router.put('/profile', authenticateToken, requireAdmin, async (req, res) => {
  try {

    const { first_name, last_name, phone, branch } = req.body;
    const adminId = req.user.user_id;

    const updateQuery = `
      UPDATE Users
      SET first_name = $1, last_name = $2, phone = $3, branch = $4, updated_at = NOW()
      WHERE user_id = $5 AND role = 'A'
      RETURNING user_id, first_name, last_name, email, phone, branch, created_at, is_verified
    `;

    const result = await pool.query(updateQuery, [first_name, last_name, phone, branch, adminId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change admin password
router.put('/profile/password', authenticateToken, requireAdmin, async (req, res) => {
  try {

    const { current_password, new_password } = req.body;
    const adminId = req.user.user_id;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const userQuery = 'SELECT password_hash FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [adminId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    const updateQuery = 'UPDATE Users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2';
    await pool.query(updateQuery, [hashedNewPassword, adminId]);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;