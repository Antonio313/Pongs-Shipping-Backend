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
      `SELECT u.user_id, u.customer_number, u.first_name, u.last_name, u.email, u.phone, u.address, u.branch,
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
      `SELECT user_id, customer_number, first_name, last_name, email, phone, address, branch,
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
      `SELECT prealert_id, user_id, description, price, invoice_url, status, created_at, tracking_number, carrier
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
    const staffId = req.user.user_id;
    const staffRole = req.user.role;

    console.log('📊 Fetching profile stats for user_id:', staffId, 'role:', staffRole);

    let stats = {};

    // Common stats for all staff
    const commonStatsQuery = `
      SELECT
        u.first_name,
        u.last_name,
        u.email,
        u.branch,
        u.created_at as join_date
      FROM Users u
      WHERE u.user_id = $1
    `;
    const commonStatsResult = await pool.query(commonStatsQuery, [staffId]);
    const commonStats = commonStatsResult.rows[0];

    // Get staff action logs for this user
    const staffActionsQuery = `
      SELECT
        COUNT(*) as total_actions,
        COALESCE(SUM(revenue_impact), 0) as total_revenue_generated,
        MAX(created_at) as last_action_date
      FROM Staff_Actions_Log
      WHERE staff_id = $1
    `;
    const staffActionsResult = await pool.query(staffActionsQuery, [staffId]);
    const staffActions = staffActionsResult.rows[0];

    // Base stats for all roles
    stats = {
      ...commonStats,
      total_actions: parseInt(staffActions.total_actions) || 0,
      total_revenue_generated: parseFloat(staffActions.total_revenue_generated) || 0,
      last_action_date: staffActions.last_action_date
    };

    // Admin/Super Admin specific statistics
    if (staffRole === 'A' || staffRole === 'S') {
      console.log('📊 Fetching admin stats for user_id:', staffId);

      // Get delivery stats (actual deliveries made by this admin)
      const adminDeliveryStatsQuery = `
        SELECT
          COUNT(DISTINCT d.delivery_id)::int as deliveries_processed,
          COALESCE(SUM(p.finalcost), 0)::numeric as total_revenue_collected,
          COUNT(DISTINCT p.package_id)::int as packages_delivered,
          COUNT(DISTINCT p.user_id)::int as customers_served
        FROM Deliveries d
        JOIN Packages p ON d.package_id = p.package_id
        WHERE d.delivered_by = $1
      `;
      const adminDeliveryStatsResult = await pool.query(adminDeliveryStatsQuery, [staffId]);
      const adminDeliveryStats = adminDeliveryStatsResult.rows[0];
      console.log('📦 Delivery stats:', adminDeliveryStats);

      // Get action stats from Staff_Actions_Log
      const adminActionStatsQuery = `
        SELECT
          COUNT(*) FILTER (WHERE action_type = 'package_created')::int as packages_created,
          COUNT(*) FILTER (WHERE action_type = 'prealert_confirmation')::int as prealerts_confirmed,
          COUNT(*) FILTER (WHERE action_type = 'transfer_creation')::int as transfers_created,
          COUNT(*) FILTER (WHERE action_type = 'package_status_update')::int as status_updates
        FROM Staff_Actions_Log
        WHERE staff_id = $1
      `;
      const adminActionStatsResult = await pool.query(adminActionStatsQuery, [staffId]);
      const adminActionStats = adminActionStatsResult.rows[0];
      console.log('📋 Action stats:', adminActionStats);

      // Get transfer stats (from Transfers table)
      const adminTransferStatsQuery = `
        SELECT
          COUNT(*)::int as transfers_created_actual,
          COUNT(*) FILTER (WHERE status = 'delivered')::int as transfers_completed
        FROM Transfers
        WHERE created_by = $1
      `;
      const adminTransferStatsResult = await pool.query(adminTransferStatsQuery, [staffId]);
      const adminTransferStats = adminTransferStatsResult.rows[0];
      console.log('🚚 Transfer stats:', adminTransferStats);

      stats = {
        ...stats,
        deliveries_processed: adminDeliveryStats.deliveries_processed || 0,
        total_revenue_collected: parseFloat(adminDeliveryStats.total_revenue_collected) || 0,
        packages_delivered: adminDeliveryStats.packages_delivered || 0,
        customers_served: adminDeliveryStats.customers_served || 0,
        packages_created: adminActionStats.packages_created || 0,
        prealerts_confirmed: adminActionStats.prealerts_confirmed || 0,
        transfers_created: adminTransferStats.transfers_created_actual || 0,
        transfers_completed: adminTransferStats.transfers_completed || 0,
        status_updates: adminActionStats.status_updates || 0,
        role_display: staffRole === 'S' ? 'Super Administrator' : 'Administrator',
        primary_focus: 'Overall Management'
      };

      console.log('✅ Final admin stats:', stats);
    } else if (staffRole === 'D') {
      // Transfer Personnel - Focuses on transfers
      console.log('📊 Fetching transfer personnel stats for user_id:', staffId);

      const transferStatsQuery = `
        SELECT
          COUNT(DISTINCT t.transfer_id)::int as transfers_created,
          COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.status = 'delivered')::int as transfers_completed,
          COUNT(DISTINCT tp.package_id)::int as total_packages_in_transfers,
          COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.status IN ('created', 'in_transit'))::int as active_transfers,
          COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.created_at >= NOW() - INTERVAL '7 days')::int as transfers_this_week,
          COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.created_at >= NOW() - INTERVAL '30 days')::int as transfers_this_month
        FROM Transfers t
        LEFT JOIN Transfer_Packages tp ON t.transfer_id = tp.transfer_id
        WHERE t.created_by = $1
      `;
      const transferStatsResult = await pool.query(transferStatsQuery, [staffId]);
      const transferStats = transferStatsResult.rows[0];
      console.log('🚚 Transfer personnel stats:', transferStats);

      stats = {
        ...stats,
        transfers_created: transferStats.transfers_created || 0,
        transfers_completed: transferStats.transfers_completed || 0,
        total_packages_in_transfers: transferStats.total_packages_in_transfers || 0,
        active_transfers: transferStats.active_transfers || 0,
        transfers_this_week: transferStats.transfers_this_week || 0,
        transfers_this_month: transferStats.transfers_this_month || 0,
        role_display: 'Transfer Personnel',
        primary_focus: 'Transfer Management'
      };

      console.log('✅ Final transfer personnel stats:', stats);
    } else if (staffRole === 'F') {
      // Front Desk - Focuses on customer service
      console.log('📊 Fetching front desk stats for user_id:', staffId);

      const frontDeskStatsQuery = `
        SELECT
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.action_type = 'prealert_confirmation')::int as prealerts_confirmed,
          COUNT(DISTINCT sal.log_id)::int as total_customer_interactions,
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '7 days')::int as actions_this_week,
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '30 days')::int as actions_this_month
        FROM Staff_Actions_Log sal
        WHERE sal.staff_id = $1
      `;
      const frontDeskStatsResult = await pool.query(frontDeskStatsQuery, [staffId]);
      const frontDeskStats = frontDeskStatsResult.rows[0];

      // Get unique customers helped through prealerts
      const uniqueCustomersQuery = `
        SELECT COUNT(DISTINCT p.user_id)::int as unique_customers_helped
        FROM Staff_Actions_Log sal
        JOIN Packages p ON p.package_id::text = sal.entity_id AND sal.entity_type = 'package'
        WHERE sal.staff_id = $1 AND sal.action_type = 'prealert_confirmation'
      `;
      const uniqueCustomersResult = await pool.query(uniqueCustomersQuery, [staffId]);
      const uniqueCustomers = uniqueCustomersResult.rows[0];

      console.log('🎫 Front desk stats:', frontDeskStats);
      console.log('👥 Unique customers:', uniqueCustomers);

      stats = {
        ...stats,
        prealerts_confirmed: frontDeskStats.prealerts_confirmed || 0,
        customers_assisted: frontDeskStats.total_customer_interactions || 0,
        unique_customers_helped: uniqueCustomers.unique_customers_helped || 0,
        actions_this_week: frontDeskStats.actions_this_week || 0,
        actions_this_month: frontDeskStats.actions_this_month || 0,
        role_display: 'Front Desk',
        primary_focus: 'Customer Service'
      };

      console.log('✅ Final front desk stats:', stats);
    } else if (staffRole === 'H') {
      // Package Handler - Focuses on package processing
      console.log('📊 Fetching package handler stats for user_id:', staffId);

      const handlerStatsQuery = `
        SELECT
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.action_type = 'package_created')::int as packages_created,
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.action_type = 'prealert_confirmation')::int as prealerts_confirmed,
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.action_type = 'package_status_update')::int as packages_updated,
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.action_type = 'transfer_creation')::int as transfers_created
        FROM Staff_Actions_Log sal
        WHERE sal.staff_id = $1
      `;
      const handlerStatsResult = await pool.query(handlerStatsQuery, [staffId]);
      const handlerStats = handlerStatsResult.rows[0];

      // Get recent activity counts
      const recentActivityQuery = `
        SELECT
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '7 days')::int as actions_this_week,
          COUNT(DISTINCT sal.log_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '30 days')::int as actions_this_month
        FROM Staff_Actions_Log sal
        WHERE sal.staff_id = $1
      `;
      const recentActivityResult = await pool.query(recentActivityQuery, [staffId]);
      const recentActivity = recentActivityResult.rows[0];

      console.log('📦 Package handler stats:', handlerStats);
      console.log('📅 Recent activity:', recentActivity);

      stats = {
        ...stats,
        packages_created: handlerStats.packages_created || 0,
        prealerts_confirmed: handlerStats.prealerts_confirmed || 0,
        packages_updated: handlerStats.packages_updated || 0,
        transfers_managed: handlerStats.transfers_created || 0,
        actions_this_week: recentActivity.actions_this_week || 0,
        actions_this_month: recentActivity.actions_this_month || 0,
        role_display: 'Package Handler',
        primary_focus: 'Package Processing & Transfers'
      };

      console.log('✅ Final package handler stats:', stats);
    } else if (staffRole === 'T') {
      // Cashier - Focuses on deliveries and payments
      console.log('📊 Fetching cashier stats for user_id:', staffId);

      const cashierStatsQuery = `
        SELECT
          COUNT(d.delivery_id)::int as deliveries_processed,
          COALESCE(SUM(p.finalcost), 0)::numeric as total_revenue_collected,
          COUNT(DISTINCT p.user_id)::int as customers_served,
          COUNT(CASE WHEN d.delivered_at >= NOW() - INTERVAL '7 days' THEN 1 END)::int as deliveries_this_week,
          COUNT(CASE WHEN d.delivered_at >= NOW() - INTERVAL '30 days' THEN 1 END)::int as deliveries_this_month,
          CASE
            WHEN COUNT(d.delivery_id) > 0 THEN COALESCE(SUM(p.finalcost), 0) / COUNT(d.delivery_id)
            ELSE 0
          END::numeric as avg_transaction_value
        FROM Deliveries d
        JOIN Packages p ON d.package_id = p.package_id
        WHERE d.delivered_by = $1
      `;
      const cashierStatsResult = await pool.query(cashierStatsQuery, [staffId]);
      const cashierStats = cashierStatsResult.rows[0];

      console.log('💰 Cashier stats:', cashierStats);

      stats = {
        ...stats,
        deliveries_processed: cashierStats.deliveries_processed || 0,
        total_revenue_collected: parseFloat(cashierStats.total_revenue_collected) || 0,
        customers_served: cashierStats.customers_served || 0,
        deliveries_this_week: cashierStats.deliveries_this_week || 0,
        deliveries_this_month: cashierStats.deliveries_this_month || 0,
        avg_transaction_value: parseFloat(cashierStats.avg_transaction_value) || 0,
        role_display: 'Cashier',
        primary_focus: 'Deliveries & Payments'
      };

      console.log('✅ Final cashier stats:', stats);
    }

    console.log('📤 Sending stats response');
    res.json({ stats });
  } catch (error) {
    console.error('❌ Error fetching admin profile stats:', error);
    res.status(500).json({ message: 'Failed to fetch profile statistics', error: error.message });
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

// GET /admin/profile/stats/download - Download daily statistics for current user
router.get('/profile/stats/download', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const staffId = req.user.user_id;
    const staffRole = req.user.role;
    const { date } = req.query; // Optional date parameter (YYYY-MM-DD)

    // Use provided date or default to today
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log('📥 Downloading daily stats for user_id:', staffId, 'role:', staffRole, 'date:', targetDate);

    // Get staff basic info
    const staffInfo = await pool.query(
      'SELECT first_name, last_name, email, role FROM Users WHERE user_id = $1',
      [staffId]
    );

    if (staffInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const staff = staffInfo.rows[0];
    const roleNames = {
      'A': 'Admin',
      'S': 'Super Admin',
      'T': 'Cashier',
      'H': 'Package Handler',
      'D': 'Transfer Personnel',
      'F': 'Front Desk'
    };

    let dailyStats = {};

    // Get role-specific daily statistics
    if (staffRole === 'T') {
      // Cashier daily stats
      const cashierDailyQuery = `
        SELECT
          COUNT(d.delivery_id)::int as deliveries_processed,
          COALESCE(SUM(p.finalcost), 0)::numeric as total_revenue_collected,
          COUNT(DISTINCT p.user_id)::int as customers_served,
          CASE
            WHEN COUNT(d.delivery_id) > 0 THEN COALESCE(SUM(p.finalcost), 0) / COUNT(d.delivery_id)
            ELSE 0
          END::numeric as avg_transaction_value
        FROM Deliveries d
        JOIN Packages p ON d.package_id = p.package_id
        WHERE d.delivered_by = $1
        AND DATE(d.delivered_at) = $2
      `;
      const result = await pool.query(cashierDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staffRole === 'H') {
      // Package Handler daily stats
      const handlerDailyQuery = `
        SELECT
          COUNT(CASE WHEN action_type = 'prealert_confirmation' THEN 1 END)::int as prealerts_confirmed,
          COUNT(CASE WHEN action_type = 'package_created' THEN 1 END)::int as packages_created,
          COUNT(CASE WHEN action_type = 'package_status_update' THEN 1 END)::int as packages_updated,
          COUNT(CASE WHEN action_type LIKE '%transfer%' THEN 1 END)::int as transfers_managed
        FROM Staff_Actions_Log
        WHERE staff_id = $1
        AND DATE(created_at) = $2
      `;
      const result = await pool.query(handlerDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staffRole === 'D') {
      // Transfer Personnel daily stats
      const transferDailyQuery = `
        SELECT
          COUNT(CASE WHEN t.status = 'created' THEN 1 END)::int as transfers_created,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::int as transfers_completed,
          COUNT(tp.package_id)::int as total_packages_in_transfers
        FROM Transfers t
        LEFT JOIN Transfer_Packages tp ON t.transfer_id = tp.transfer_id
        WHERE t.created_by = $1
        AND DATE(t.created_at) = $2
      `;
      const result = await pool.query(transferDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staffRole === 'F') {
      // Front Desk daily stats
      const frontDeskDailyQuery = `
        SELECT
          COUNT(CASE WHEN action_type = 'prealert_confirmation' THEN 1 END)::int as prealerts_confirmed,
          COUNT(DISTINCT CAST(metadata->>'customerId' AS INTEGER))::int as customers_assisted,
          COUNT(DISTINCT staff_id)::int as unique_customers_helped
        FROM Staff_Actions_Log
        WHERE staff_id = $1
        AND DATE(created_at) = $2
      `;
      const result = await pool.query(frontDeskDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staffRole === 'A' || staffRole === 'S') {
      // Admin/Super Admin daily stats
      const adminDailyQuery = `
        SELECT
          COUNT(CASE WHEN action_type = 'delivery_processed' THEN 1 END)::int as deliveries_processed,
          COUNT(CASE WHEN action_type = 'package_created' THEN 1 END)::int as packages_created,
          COUNT(CASE WHEN action_type = 'prealert_confirmation' THEN 1 END)::int as prealerts_confirmed,
          COUNT(CASE WHEN action_type = 'transfer_created' THEN 1 END)::int as transfers_created,
          COALESCE(SUM(CASE WHEN action_type = 'delivery_processed' THEN revenue_impact ELSE 0 END), 0)::numeric as total_revenue_collected
        FROM Staff_Actions_Log
        WHERE staff_id = $1
        AND DATE(created_at) = $2
      `;
      const result = await pool.query(adminDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    }

    // Return as JSON for download
    res.json({
      staff_name: `${staff.first_name} ${staff.last_name}`,
      staff_email: staff.email,
      role: roleNames[staff.role] || 'Staff',
      date: targetDate,
      statistics: dailyStats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error downloading daily stats:', error);
    res.status(500).json({ message: 'Error downloading statistics' });
  }
});

// GET /admin/profile/stats/download/:staffId - Download daily statistics for specific staff (Super Admin only)
router.get('/profile/stats/download/:staffId', authenticateToken, async (req, res) => {
  try {
    // Only super admins can download other staff's statistics
    if (req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
    }

    const staffId = req.params.staffId;
    const { date } = req.query; // Optional date parameter (YYYY-MM-DD)

    // Use provided date or default to today
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log('📥 Super Admin downloading daily stats for staff_id:', staffId, 'date:', targetDate);

    // Get staff basic info
    const staffInfo = await pool.query(
      'SELECT first_name, last_name, email, role FROM Users WHERE user_id = $1 AND role IN (\'A\', \'S\', \'T\', \'H\', \'D\', \'F\')',
      [staffId]
    );

    if (staffInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const staff = staffInfo.rows[0];
    const roleNames = {
      'A': 'Admin',
      'S': 'Super Admin',
      'T': 'Cashier',
      'H': 'Package Handler',
      'D': 'Transfer Personnel',
      'F': 'Front Desk'
    };

    let dailyStats = {};

    // Get role-specific daily statistics
    if (staff.role === 'T') {
      const cashierDailyQuery = `
        SELECT
          COUNT(d.delivery_id)::int as deliveries_processed,
          COALESCE(SUM(p.finalcost), 0)::numeric as total_revenue_collected,
          COUNT(DISTINCT p.user_id)::int as customers_served,
          CASE
            WHEN COUNT(d.delivery_id) > 0 THEN COALESCE(SUM(p.finalcost), 0) / COUNT(d.delivery_id)
            ELSE 0
          END::numeric as avg_transaction_value
        FROM Deliveries d
        JOIN Packages p ON d.package_id = p.package_id
        WHERE d.delivered_by = $1
        AND DATE(d.delivered_at) = $2
      `;
      const result = await pool.query(cashierDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staff.role === 'H') {
      const handlerDailyQuery = `
        SELECT
          COUNT(CASE WHEN action_type = 'prealert_confirmation' THEN 1 END)::int as prealerts_confirmed,
          COUNT(CASE WHEN action_type = 'package_created' THEN 1 END)::int as packages_created,
          COUNT(CASE WHEN action_type = 'package_status_update' THEN 1 END)::int as packages_updated,
          COUNT(CASE WHEN action_type LIKE '%transfer%' THEN 1 END)::int as transfers_managed
        FROM Staff_Actions_Log
        WHERE staff_id = $1
        AND DATE(created_at) = $2
      `;
      const result = await pool.query(handlerDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staff.role === 'D') {
      const transferDailyQuery = `
        SELECT
          COUNT(CASE WHEN t.status = 'created' THEN 1 END)::int as transfers_created,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::int as transfers_completed,
          COUNT(tp.package_id)::int as total_packages_in_transfers
        FROM Transfers t
        LEFT JOIN Transfer_Packages tp ON t.transfer_id = tp.transfer_id
        WHERE t.created_by = $1
        AND DATE(t.created_at) = $2
      `;
      const result = await pool.query(transferDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staff.role === 'F') {
      const frontDeskDailyQuery = `
        SELECT
          COUNT(CASE WHEN action_type = 'prealert_confirmation' THEN 1 END)::int as prealerts_confirmed,
          COUNT(DISTINCT CAST(metadata->>'customerId' AS INTEGER))::int as customers_assisted,
          COUNT(DISTINCT staff_id)::int as unique_customers_helped
        FROM Staff_Actions_Log
        WHERE staff_id = $1
        AND DATE(created_at) = $2
      `;
      const result = await pool.query(frontDeskDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    } else if (staff.role === 'A' || staff.role === 'S') {
      const adminDailyQuery = `
        SELECT
          COUNT(CASE WHEN action_type = 'delivery_processed' THEN 1 END)::int as deliveries_processed,
          COUNT(CASE WHEN action_type = 'package_created' THEN 1 END)::int as packages_created,
          COUNT(CASE WHEN action_type = 'prealert_confirmation' THEN 1 END)::int as prealerts_confirmed,
          COUNT(CASE WHEN action_type = 'transfer_created' THEN 1 END)::int as transfers_created,
          COALESCE(SUM(CASE WHEN action_type = 'delivery_processed' THEN revenue_impact ELSE 0 END), 0)::numeric as total_revenue_collected
        FROM Staff_Actions_Log
        WHERE staff_id = $1
        AND DATE(created_at) = $2
      `;
      const result = await pool.query(adminDailyQuery, [staffId, targetDate]);
      dailyStats = result.rows[0];
    }

    // Return as JSON for download
    res.json({
      staff_name: `${staff.first_name} ${staff.last_name}`,
      staff_email: staff.email,
      role: roleNames[staff.role] || 'Staff',
      date: targetDate,
      statistics: dailyStats,
      downloaded_by: `${req.user.first_name} ${req.user.last_name}`,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error downloading staff daily stats:', error);
    res.status(500).json({ message: 'Error downloading statistics' });
  }
});

module.exports = router;