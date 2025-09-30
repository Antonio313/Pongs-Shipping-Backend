const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get admin profile statistics
router.get('/profile/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

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

    // Get packages processed count (packages created or updated by this admin)
    const packagesProcessedQuery = `
      SELECT COUNT(*) as packages_processed
      FROM Packages p
      WHERE p.created_by = $1 OR p.updated_by = $1
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

    const stats = {
      deliveries_count: parseInt(deliveryStats.deliveries_count) || 0,
      total_amount_handled: parseFloat(deliveryStats.total_amount_handled) || 0,
      packages_processed: parseInt(packagesProcessed) || 0,
      total_packages_handled: parseInt(packagesProcessed) || 0, // Alias for consistency
      customers_served: parseInt(customersServed) || 0,
      last_delivery: deliveryStats.last_delivery
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching admin profile stats:', error);
    res.status(500).json({ message: 'Failed to fetch profile statistics' });
  }
});

// Update admin profile information
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

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
router.put('/profile/password', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { current_password, new_password } = req.body;
    const adminId = req.user.user_id;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const userQuery = 'SELECT password FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [adminId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const bcrypt = require('bcrypt');
    const isCurrentPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    const updateQuery = 'UPDATE Users SET password = $1, updated_at = NOW() WHERE user_id = $2';
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