const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get staff profile statistics (role-specific)
router.get('/profile/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const staffId = req.user.user_id;
    const staffRole = req.user.role;

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

    // Role-specific statistics
    switch (staffRole) {
      case 'T': // Cashier - Focuses on deliveries and payments
        const cashierStatsQuery = `
          SELECT
            COUNT(d.delivery_id) as deliveries_processed,
            COALESCE(SUM(p.finalcost), 0) as total_revenue_collected,
            COUNT(DISTINCT p.user_id) as customers_served,
            COUNT(CASE WHEN d.delivered_at >= NOW() - INTERVAL '7 days' THEN 1 END) as deliveries_this_week,
            COUNT(CASE WHEN d.delivered_at >= NOW() - INTERVAL '30 days' THEN 1 END) as deliveries_this_month,
            CASE
              WHEN COUNT(d.delivery_id) > 0 THEN COALESCE(SUM(p.finalcost), 0) / COUNT(d.delivery_id)
              ELSE 0
            END as avg_transaction_value
          FROM Deliveries d
          JOIN Packages p ON d.package_id = p.package_id
          WHERE d.delivered_by = $1
        `;
        const cashierStatsResult = await pool.query(cashierStatsQuery, [staffId]);
        const cashierStats = cashierStatsResult.rows[0];

        stats = {
          ...stats,
          deliveries_processed: parseInt(cashierStats.deliveries_processed) || 0,
          total_revenue_collected: parseFloat(cashierStats.total_revenue_collected) || 0,
          customers_served: parseInt(cashierStats.customers_served) || 0,
          deliveries_this_week: parseInt(cashierStats.deliveries_this_week) || 0,
          deliveries_this_month: parseInt(cashierStats.deliveries_this_month) || 0,
          avg_transaction_value: parseFloat(cashierStats.avg_transaction_value) || 0,
          role_display: 'Cashier',
          primary_focus: 'Deliveries & Payments'
        };
        break;

      case 'H': // Package Handler - Focuses on package processing
        const handlerStatsQuery = `
          SELECT
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.action_type = 'package_created') as packages_created,
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.action_type = 'prealert_confirmation') as prealerts_confirmed,
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.action_type = 'package_status_update') as packages_updated,
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.action_type = 'transfer_created') as transfers_created
          FROM Staff_Actions_Log sal
          WHERE sal.staff_id = $1
        `;
        const handlerStatsResult = await pool.query(handlerStatsQuery, [staffId]);
        const handlerStats = handlerStatsResult.rows[0];

        // Get recent activity counts
        const recentActivityQuery = `
          SELECT
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '7 days') as actions_this_week,
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '30 days') as actions_this_month
          FROM Staff_Actions_Log sal
          WHERE sal.staff_id = $1
        `;
        const recentActivityResult = await pool.query(recentActivityQuery, [staffId]);
        const recentActivity = recentActivityResult.rows[0];

        stats = {
          ...stats,
          packages_created: parseInt(handlerStats.packages_created) || 0,
          prealerts_confirmed: parseInt(handlerStats.prealerts_confirmed) || 0,
          packages_updated: parseInt(handlerStats.packages_updated) || 0,
          transfers_managed: parseInt(handlerStats.transfers_created) || 0,
          actions_this_week: parseInt(recentActivity.actions_this_week) || 0,
          actions_this_month: parseInt(recentActivity.actions_this_month) || 0,
          role_display: 'Package Handler',
          primary_focus: 'Package Processing & Transfers'
        };
        break;

      case 'D': // Transfer Personnel - Focuses on transfers
        const transferStatsQuery = `
          SELECT
            COUNT(DISTINCT t.transfer_id) as transfers_created,
            COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.status = 'delivered') as transfers_completed,
            COUNT(DISTINCT tp.package_id) as total_packages_in_transfers,
            COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.status IN ('created', 'in_transit')) as active_transfers,
            COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.created_at >= NOW() - INTERVAL '7 days') as transfers_this_week,
            COUNT(DISTINCT t.transfer_id) FILTER (WHERE t.created_at >= NOW() - INTERVAL '30 days') as transfers_this_month
          FROM Transfers t
          LEFT JOIN Transfer_Packages tp ON t.transfer_id = tp.transfer_id
          WHERE t.created_by = $1
        `;
        const transferStatsResult = await pool.query(transferStatsQuery, [staffId]);
        const transferStats = transferStatsResult.rows[0];

        stats = {
          ...stats,
          transfers_created: parseInt(transferStats.transfers_created) || 0,
          transfers_completed: parseInt(transferStats.transfers_completed) || 0,
          total_packages_in_transfers: parseInt(transferStats.total_packages_in_transfers) || 0,
          active_transfers: parseInt(transferStats.active_transfers) || 0,
          transfers_this_week: parseInt(transferStats.transfers_this_week) || 0,
          transfers_this_month: parseInt(transferStats.transfers_this_month) || 0,
          role_display: 'Transfer Personnel',
          primary_focus: 'Transfer Management'
        };
        break;

      case 'F': // Front Desk - Focuses on customer service
        const frontDeskStatsQuery = `
          SELECT
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.action_type = 'prealert_confirmation') as prealerts_confirmed,
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.action_type = 'customer_assisted') as customers_assisted,
            COUNT(DISTINCT p.user_id) as unique_customers_helped,
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '7 days') as actions_this_week,
            COUNT(DISTINCT sal.action_id) FILTER (WHERE sal.created_at >= NOW() - INTERVAL '30 days') as actions_this_month
          FROM Staff_Actions_Log sal
          LEFT JOIN Packages p ON sal.entity_id::text = p.package_id::text AND sal.entity_type = 'package'
          WHERE sal.staff_id = $1
        `;
        const frontDeskStatsResult = await pool.query(frontDeskStatsQuery, [staffId]);
        const frontDeskStats = frontDeskStatsResult.rows[0];

        stats = {
          ...stats,
          prealerts_confirmed: parseInt(frontDeskStats.prealerts_confirmed) || 0,
          customers_assisted: parseInt(frontDeskStats.customers_assisted) || 0,
          unique_customers_helped: parseInt(frontDeskStats.unique_customers_helped) || 0,
          actions_this_week: parseInt(frontDeskStats.actions_this_week) || 0,
          actions_this_month: parseInt(frontDeskStats.actions_this_month) || 0,
          role_display: 'Front Desk',
          primary_focus: 'Customer Service'
        };
        break;

      case 'A': // Admin - Comprehensive stats
      case 'S': // Super Admin - Comprehensive stats
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
        break;

      default:
        stats.role_display = 'Staff Member';
        stats.primary_focus = 'General Tasks';
    }

    console.log('📤 Sending stats response:', JSON.stringify(stats, null, 2));
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching staff profile stats:', error);
    res.status(500).json({ message: 'Failed to fetch profile statistics', error: error.message });
  }
});

// Update staff profile information
router.put('/profile', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { first_name, last_name, phone, branch } = req.body;
    const staffId = req.user.user_id;

    const updateQuery = `
      UPDATE Users
      SET first_name = $1, last_name = $2, phone = $3, branch = $4, updated_at = NOW()
      WHERE user_id = $5
      RETURNING user_id, first_name, last_name, email, phone, branch, role, created_at, is_verified
    `;

    const result = await pool.query(updateQuery, [first_name, last_name, phone, branch, staffId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating staff profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change staff password
router.put('/profile/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const staffId = req.user.user_id;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const userQuery = 'SELECT password FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [staffId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
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
    await pool.query(updateQuery, [hashedNewPassword, staffId]);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing staff password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;
