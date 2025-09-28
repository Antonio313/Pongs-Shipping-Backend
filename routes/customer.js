const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get customer profile statistics
router.get('/profile/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'C') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const customerId = req.user.user_id;

    // Get package statistics
    const packageStatsQuery = `
      SELECT
        COUNT(*) as total_packages,
        COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_packages,
        COUNT(CASE WHEN status NOT IN ('Delivered', 'Processing') THEN 1 END) as in_transit_packages,
        COALESCE(SUM(finalcost), 0) as total_amount_spent,
        MIN(created_at) as first_package_date,
        MAX(CASE WHEN status = 'Delivered' THEN updated_at END) as last_delivery_date
      FROM Packages
      WHERE user_id = $1
    `;

    const packageStatsResult = await pool.query(packageStatsQuery, [customerId]);
    const packageStats = packageStatsResult.rows[0];

    // Get prealert statistics
    const prealertStatsQuery = `
      SELECT
        COUNT(*) as total_prealerts,
        COUNT(CASE WHEN status = 'C' THEN 1 END) as confirmed_prealerts,
        COUNT(CASE WHEN status = 'U' THEN 1 END) as pending_prealerts
      FROM PreAlerts
      WHERE user_id = $1
    `;

    const prealertStatsResult = await pool.query(prealertStatsQuery, [customerId]);
    const prealertStats = prealertStatsResult.rows[0];

    // Get recent deliveries
    const recentDeliveriesQuery = `
      SELECT
        p.tracking_number,
        p.finalcost,
        d.delivered_at,
        d.received_by
      FROM Deliveries d
      JOIN Packages p ON d.package_id = p.package_id
      WHERE p.user_id = $1
      ORDER BY d.delivered_at DESC
      LIMIT 5
    `;

    const recentDeliveriesResult = await pool.query(recentDeliveriesQuery, [customerId]);

    const stats = {
      total_packages: parseInt(packageStats.total_packages) || 0,
      delivered_packages: parseInt(packageStats.delivered_packages) || 0,
      in_transit_packages: parseInt(packageStats.in_transit_packages) || 0,
      total_prealerts: parseInt(prealertStats.total_prealerts) || 0,
      confirmed_prealerts: parseInt(prealertStats.confirmed_prealerts) || 0,
      pending_prealerts: parseInt(prealertStats.pending_prealerts) || 0,
      total_amount_spent: parseFloat(packageStats.total_amount_spent) || 0,
      first_package_date: packageStats.first_package_date,
      last_delivery_date: packageStats.last_delivery_date,
      recent_deliveries: recentDeliveriesResult.rows
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching customer profile stats:', error);
    res.status(500).json({ message: 'Failed to fetch profile statistics' });
  }
});

// Function to generate complete address structure based on branch, preserving user ID
const generateCompleteAddress = (branch, currentAddress = '', userId = null) => {
  if (!branch) return { formatted: currentAddress, data: null };

  // Fixed address components
  const addressLine1 = '3132 NW 43rd Street';
  const city = 'Lauderdale Lakes';
  const state = 'Florida';
  const zipCode = '33309';

  // Extract user ID from current address using regex
  const pscMatch = currentAddress.match(/PSC\s+\w+\s+(\d+)/);
  let userIdNumber = '';

  if (pscMatch) {
    userIdNumber = pscMatch[1]; // Get the captured user ID number
  } else if (userId) {
    // If we can't extract from address, use the provided userId
    userIdNumber = userId < 10 ? `0${userId}` : `${userId}`;
  } else {
    // If we can't extract the user ID and no userId provided, return current address
    return { formatted: currentAddress, data: null };
  }

  // Generate complete address structure
  const addressLine2 = `PSC ${branch} ${userIdNumber}`;

  const addressData = {
    address_line_1: addressLine1,
    address_line_2: addressLine2,
    city: city,
    state: state,
    zip_code: zipCode,
    formatted: `${addressLine1}, ${addressLine2}, ${city}, ${state} ${zipCode}`
  };

  return { formatted: addressData.formatted, data: addressData };
};

// Update customer profile information
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'C') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const { first_name, last_name, phone, branch } = req.body;
    const customerId = req.user.user_id;

    // Get current user data to preserve existing address
    const currentUserQuery = 'SELECT address FROM Users WHERE user_id = $1';
    const currentUserResult = await pool.query(currentUserQuery, [customerId]);
    const currentAddress = currentUserResult.rows[0]?.address || '';

    // Auto-generate complete address based on selected branch, preserving user ID
    const addressResult = generateCompleteAddress(branch, currentAddress, customerId);

    const updateQuery = `
      UPDATE Users
      SET first_name = $1, last_name = $2, phone = $3, address = $4, address_data = $5, branch = $6, updated_at = NOW()
      WHERE user_id = $7 AND role = 'C'
      RETURNING user_id, first_name, last_name, email, phone, address, address_data, branch, created_at, is_verified
    `;

    const result = await pool.query(updateQuery, [
      first_name,
      last_name,
      phone,
      addressResult.formatted,
      addressResult.data ? JSON.stringify(addressResult.data) : null,
      branch,
      customerId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change customer password
router.put('/profile/password', authenticateToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'C') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const { current_password, new_password } = req.body;
    const customerId = req.user.user_id;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const userQuery = 'SELECT password FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [customerId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    const updateQuery = 'UPDATE Users SET password = $1, updated_at = NOW() WHERE user_id = $2';
    await pool.query(updateQuery, [hashedNewPassword, customerId]);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing customer password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Get customer complete address information
router.get('/address', authenticateToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'C') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const customerId = req.user.user_id;

    const userQuery = 'SELECT address, address_data, branch FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [customerId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const user = userResult.rows[0];
    let addressData = null;

    // Try to parse address_data if it exists
    if (user.address_data) {
      try {
        addressData = JSON.parse(user.address_data);
      } catch (e) {
        console.warn('Failed to parse address_data for user:', customerId);
      }
    }

    // If no address_data exists, generate it from current address and branch
    if (!addressData && user.address && user.branch) {
      const addressResult = generateCompleteAddress(user.branch, user.address, customerId);
      addressData = addressResult.data;

      // Update the database with the generated address_data
      if (addressData) {
        await pool.query(
          'UPDATE Users SET address_data = $1 WHERE user_id = $2',
          [JSON.stringify(addressData), customerId]
        );
      }
    }

    res.json({
      success: true,
      address: {
        formatted: user.address,
        ...addressData
      }
    });
  } catch (error) {
    console.error('Error fetching customer address:', error);
    res.status(500).json({ message: 'Failed to fetch address information' });
  }
});

module.exports = router;