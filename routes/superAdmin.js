const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

const router = express.Router();

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// SuperAdmin middleware
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'S') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
};

// Helper function to log staff actions
const logStaffAction = async (staffId, actionType, entityType, entityId, description, revenueImpact = 0, metadata = {}) => {
  try {
    await pool.query(
      `INSERT INTO Staff_Actions_Log (staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [staffId, actionType, entityType, entityId, description, revenueImpact, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Error logging staff action:', error);
  }
};

// Helper function to update staff performance
const updateStaffPerformance = async (staffId, metrics) => {
  try {
    const date = new Date().toISOString().split('T')[0];

    // Use UPSERT to update or insert performance record
    await pool.query(
      `INSERT INTO Staff_Performance (staff_id, date, packages_processed, transfers_created, customers_added, revenue_generated, prealerts_confirmed, notifications_sent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (staff_id, date)
       DO UPDATE SET
         packages_processed = Staff_Performance.packages_processed + EXCLUDED.packages_processed,
         transfers_created = Staff_Performance.transfers_created + EXCLUDED.transfers_created,
         customers_added = Staff_Performance.customers_added + EXCLUDED.customers_added,
         revenue_generated = Staff_Performance.revenue_generated + EXCLUDED.revenue_generated,
         prealerts_confirmed = Staff_Performance.prealerts_confirmed + EXCLUDED.prealerts_confirmed,
         notifications_sent = Staff_Performance.notifications_sent + EXCLUDED.notifications_sent,
         updated_at = CURRENT_TIMESTAMP`,
      [staffId, date, metrics.packages || 0, metrics.transfers || 0, metrics.customers || 0,
       metrics.revenue || 0, metrics.prealerts || 0, metrics.notifications || 0]
    );
  } catch (error) {
    console.error('Error updating staff performance:', error);
  }
};

// GET /superadmin/dashboard - Get comprehensive dashboard data
router.get('/dashboard', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get overall statistics
    const [totalStats, todayStats, staffCount, recentActivity] = await Promise.all([
      // Total system statistics
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM Users WHERE role = 'C') as total_customers,
          (SELECT COUNT(*) FROM Users WHERE role = 'A') as total_staff,
          (SELECT COUNT(*) FROM Packages) as total_packages,
          (SELECT COUNT(*) FROM Transfers) as total_transfers,
          (SELECT COALESCE(SUM(revenue_impact), 0) FROM Staff_Actions_Log) as total_revenue
      `),

      // Today's statistics
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM Packages WHERE DATE(created_at) = $1) as packages_today,
          (SELECT COUNT(*) FROM Transfers WHERE DATE(created_at) = $1) as transfers_today,
          (SELECT COUNT(*) FROM Users WHERE role = 'C' AND DATE(created_at) = $1) as customers_today,
          (SELECT COALESCE(SUM(revenue_impact), 0) FROM Staff_Actions_Log WHERE DATE(created_at) = $1) as revenue_today
      `, [today]),

      // Active staff count
      pool.query(`
        SELECT COUNT(*) as active_staff
        FROM Users
        WHERE role IN ('A', 'S', 'T', 'H', 'D', 'F') AND DATE(created_at) >= $1
      `, [lastMonth]),

      // Recent activity
      pool.query(`
        SELECT * FROM Staff_Actions_Log
        ORDER BY created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      totalStats: totalStats.rows[0],
      todayStats: todayStats.rows[0],
      activeStaff: staffCount.rows[0].active_staff,
      recentActivity: recentActivity.rows
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// GET /superadmin/staff-performance - Get real-time staff performance analytics
router.get('/staff-performance', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { period = '7', staffId } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let staffFilter = '';
    let params = [startDate];

    if (staffId) {
      staffFilter = ' AND sal.staff_id = $2';
      params.push(staffId);
    }

    // Get real-time staff performance from action logs and live data
    const summaryQuery = `
      WITH staff_actions AS (
        SELECT
          sal.staff_id,
          u.first_name,
          u.last_name,
          u.branch,
          u.email,

          -- Count different action types
          COUNT(CASE WHEN sal.action_type = 'package_status_update' THEN 1 END) as packages_processed,
          COUNT(CASE WHEN sal.action_type = 'prealert_confirmation' THEN 1 END) as prealerts_confirmed,
          COUNT(CASE WHEN sal.action_type = 'transfer_creation' THEN 1 END) as transfers_created,

          -- Sum revenue impact
          COALESCE(SUM(sal.revenue_impact), 0) as total_revenue,

          -- Calculate averages
          COALESCE(AVG(sal.revenue_impact), 0) as avg_revenue_per_action,

          -- Count total actions
          COUNT(*) as total_actions,

          -- Get latest activity
          MAX(sal.created_at) as last_activity

        FROM Staff_Actions_Log sal
        JOIN Users u ON sal.staff_id = u.user_id
        WHERE sal.created_at >= $1 ${staffFilter}
          AND u.role IN ('A', 'S', 'T', 'H', 'D', 'F')
        GROUP BY sal.staff_id, u.first_name, u.last_name, u.branch, u.email
      ),
      all_staff AS (
        SELECT
          u.user_id as staff_id,
          u.first_name,
          u.last_name,
          u.branch,
          u.email,
          0 as packages_processed,
          0 as prealerts_confirmed,
          0 as transfers_created,
          0 as total_revenue,
          0 as avg_revenue_per_action,
          0 as total_actions,
          NULL::timestamp as last_activity
        FROM Users u
        WHERE u.role IN ('A', 'S', 'T', 'H', 'D', 'F')
          AND NOT EXISTS (
            SELECT 1 FROM staff_actions sa WHERE sa.staff_id = u.user_id
          )
      )
      SELECT * FROM staff_actions
      UNION ALL
      SELECT * FROM all_staff
      ORDER BY total_revenue DESC, total_actions DESC
    `;

    const summaryResult = await pool.query(summaryQuery, params);

    // Get recent activity feed (real-time action logs)
    const activityQuery = `
      SELECT
        sal.*,
        u.first_name,
        u.last_name,
        u.branch
      FROM Staff_Actions_Log sal
      JOIN Users u ON sal.staff_id = u.user_id
      WHERE sal.created_at >= $1 ${staffFilter}
        AND u.role IN ('A', 'S', 'T', 'H', 'D', 'F')
      ORDER BY sal.created_at DESC
      LIMIT 50
    `;

    const activityResult = await pool.query(activityQuery, params);

    // Get daily breakdown for trend analysis
    const dailyQuery = `
      SELECT
        DATE(sal.created_at) as date,
        sal.staff_id,
        u.first_name,
        u.last_name,
        u.branch,
        COUNT(CASE WHEN sal.action_type = 'package_status_update' THEN 1 END) as packages_processed,
        COUNT(CASE WHEN sal.action_type = 'prealert_confirmation' THEN 1 END) as prealerts_confirmed,
        COUNT(CASE WHEN sal.action_type = 'transfer_creation' THEN 1 END) as transfers_created,
        COALESCE(SUM(sal.revenue_impact), 0) as revenue_generated,
        COUNT(*) as total_actions
      FROM Staff_Actions_Log sal
      JOIN Users u ON sal.staff_id = u.user_id
      WHERE sal.created_at >= $1 ${staffFilter}
        AND u.role IN ('A', 'S', 'T', 'H', 'D', 'F')
      GROUP BY DATE(sal.created_at), sal.staff_id, u.first_name, u.last_name, u.branch
      ORDER BY date DESC, revenue_generated DESC
    `;

    const dailyResult = await pool.query(dailyQuery, params);

    res.json({
      staffSummary: summaryResult.rows,
      recentActivity: activityResult.rows,
      dailyPerformance: dailyResult.rows,
      realTime: true,
      period: days,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching real-time staff performance:', error);
    res.status(500).json({ message: 'Error fetching real-time staff performance' });
  }
});

// GET /superadmin/staff - Get all staff members
router.get('/staff', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        user_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        branch,
        role,
        is_verified,
        created_at,
        (SELECT COUNT(*) FROM Staff_Performance WHERE staff_id = Users.user_id) as performance_records
      FROM Users
      WHERE role IN ('A', 'S', 'T', 'H', 'D', 'F', 'C')
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

// POST /superadmin/staff - Create new staff member
router.post('/staff', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, address, branch, role = 'A' } = req.body;

    if (!first_name || !last_name || !email || !password || !branch) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (!['A', 'S', 'T', 'H', 'D', 'F', 'C'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: S (Super Admin), A (Admin), T (Cashier), H (Package Handler), D (Transfer Personnel), F (Front Desk), C (Customer)' });
    }

    // Check if email already exists
    const existingUser = await pool.query('SELECT user_id FROM Users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new staff member
    const result = await pool.query(`
      INSERT INTO Users (first_name, last_name, email, password_hash, phone, address, branch, role, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING user_id, first_name, last_name, email, branch, role, created_at
    `, [first_name, last_name, email, hashedPassword, phone, address, branch, role]);

    const newStaff = result.rows[0];

    // Log the action
    const roleNames = {
      'S': 'super admin',
      'A': 'admin',
      'T': 'cashier',
      'H': 'package handler',
      'D': 'transfer personnel',
      'F': 'front desk',
      'C': 'customer'
    };
    await logStaffAction(
      req.user.userId,
      'staff_created',
      'user',
      newStaff.user_id,
      `Created new ${roleNames[role] || role} user: ${first_name} ${last_name}`,
      0,
      { email, branch, role }
    );

    // Update performance metrics
    await updateStaffPerformance(req.user.userId, { customers: 1 });

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: newStaff
    });

  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ message: 'Error creating staff member' });
  }
});

// PATCH /superadmin/staff/:id - Update staff member
router.patch('/staff/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    if (!['A', 'S', 'T', 'H', 'D', 'F', 'C'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: S (Super Admin), A (Admin), T (Cashier), H (Package Handler), D (Transfer Personnel), F (Front Desk), C (Customer)' });
    }

    // Check if staff member exists
    const existingStaff = await pool.query(
      'SELECT * FROM Users WHERE user_id = $1',
      [id]
    );

    if (existingStaff.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT user_id FROM Users WHERE email = $1 AND user_id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Update staff member
    const updateResult = await pool.query(
      'UPDATE Users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE user_id = $5 RETURNING *',
      [first_name, last_name, email, role, id]
    );

    const updatedStaff = updateResult.rows[0];

    // Remove sensitive information
    delete updatedStaff.password_hash;

    res.status(200).json({
      message: 'Staff member updated successfully',
      staff: updatedStaff
    });

  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ message: 'Failed to update staff member' });
  }
});

// DELETE /superadmin/staff/:id - Delete staff member
router.delete('/staff/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get staff info before deletion
    const staffInfo = await pool.query(
      'SELECT first_name, last_name, email, role FROM Users WHERE user_id = $1 AND role IN (\'A\', \'S\')',
      [id]
    );

    if (staffInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const staff = staffInfo.rows[0];

    // Prevent deleting the last super admin
    if (staff.role === 'S') {
      const superAdminCount = await pool.query('SELECT COUNT(*) FROM Users WHERE role = \'S\'');
      if (parseInt(superAdminCount.rows[0].count) <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last Super Admin' });
      }
    }

    // Delete the staff member
    await pool.query('DELETE FROM Users WHERE user_id = $1', [id]);

    // Log the action
    await logStaffAction(
      req.user.userId,
      'staff_deleted',
      'user',
      id,
      `Deleted ${staff.role === 'A' ? 'admin' : 'super admin'} staff member: ${staff.first_name} ${staff.last_name}`,
      0,
      { email: staff.email, role: staff.role }
    );

    res.json({ message: 'Staff member deleted successfully' });

  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ message: 'Error deleting staff member' });
  }
});

// DELETE /superadmin/customers/:id - Delete customer
router.delete('/customers/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get customer info before deletion
    const customerInfo = await pool.query(
      'SELECT first_name, last_name, email FROM Users WHERE user_id = $1 AND role = \'C\'',
      [id]
    );

    if (customerInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = customerInfo.rows[0];

    // Check for associated packages
    const packageCount = await pool.query('SELECT COUNT(*) FROM Packages WHERE user_id = $1', [id]);
    const packages = parseInt(packageCount.rows[0].count);

    // Delete the customer (CASCADE will handle related records)
    await pool.query('DELETE FROM Users WHERE user_id = $1', [id]);

    // Log the action
    await logStaffAction(
      req.user.userId,
      'customer_deleted',
      'user',
      id,
      `Deleted customer: ${customer.first_name} ${customer.last_name} (had ${packages} packages)`,
      0,
      { email: customer.email, package_count: packages }
    );

    res.json({
      message: 'Customer deleted successfully',
      deletedPackages: packages
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

// GET /superadmin/analytics/revenue - Get revenue analytics
router.get('/analytics/revenue', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [dailyRevenue, staffRevenue, branchRevenue] = await Promise.all([
      // Daily revenue breakdown (from actual deliveries)
      pool.query(`
        SELECT
          DATE(sal.created_at) as date,
          COUNT(CASE WHEN sal.action_type = 'package_delivery' THEN 1 END) as package_count,
          COALESCE(SUM(CASE WHEN sal.action_type = 'package_delivery' THEN sal.revenue_impact ELSE 0 END), 0) as revenue
        FROM Staff_Actions_Log sal
        WHERE DATE(sal.created_at) >= $1
        GROUP BY DATE(sal.created_at)
        ORDER BY date DESC
      `, [startDate]),

      // Revenue by staff (from actual deliveries)
      pool.query(`
        SELECT
          sal.staff_id,
          u.first_name,
          u.last_name,
          u.branch,
          COALESCE(SUM(CASE WHEN sal.action_type = 'package_delivery' THEN sal.revenue_impact ELSE 0 END), 0) as total_revenue,
          COUNT(CASE WHEN sal.action_type = 'package_delivery' THEN 1 END) as total_packages
        FROM Staff_Actions_Log sal
        JOIN Users u ON sal.staff_id = u.user_id
        WHERE sal.created_at >= $1 AND u.role IN ('A', 'S', 'T', 'H', 'D', 'F')
        GROUP BY sal.staff_id, u.first_name, u.last_name, u.branch
        ORDER BY total_revenue DESC
      `, [startDate]),

      // Revenue by branch (from actual deliveries)
      pool.query(`
        SELECT
          u.branch,
          COUNT(CASE WHEN sal.action_type = 'package_delivery' THEN 1 END) as package_count,
          COALESCE(SUM(CASE WHEN sal.action_type = 'package_delivery' THEN sal.revenue_impact ELSE 0 END), 0) as revenue
        FROM Staff_Actions_Log sal
        JOIN Users u ON sal.staff_id = u.user_id
        WHERE sal.created_at >= $1 AND u.role IN ('A', 'S', 'T', 'H', 'D', 'F')
        GROUP BY u.branch
        ORDER BY revenue DESC
      `, [startDate])
    ]);

    res.json({
      dailyRevenue: dailyRevenue.rows,
      staffRevenue: staffRevenue.rows,
      branchRevenue: branchRevenue.rows
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Error fetching revenue analytics' });
  }
});

// GET /superadmin/system-overview - Get complete system overview
router.get('/system-overview', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const [packages, transfers, customers, staff] = await Promise.all([
      // Package status breakdown
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM Packages
        GROUP BY status
        ORDER BY count DESC
      `),

      // Transfer status breakdown
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM Transfers
        GROUP BY status
        ORDER BY count DESC
      `),

      // Customer verification status
      pool.query(`
        SELECT
          branch,
          COUNT(*) as total,
          SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified
        FROM Users
        WHERE role = 'C'
        GROUP BY branch
      `),

      // Staff by branch and role
      pool.query(`
        SELECT
          branch,
          role,
          COUNT(*) as count
        FROM Users
        WHERE role IN ('A', 'S', 'T', 'H', 'D', 'F')
        GROUP BY branch, role
        ORDER BY branch, role
      `)
    ]);

    res.json({
      packagesByStatus: packages.rows,
      transfersByStatus: transfers.rows,
      customersByBranch: customers.rows,
      staffByBranch: staff.rows
    });

  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({ message: 'Error fetching system overview' });
  }
});

// GET /superadmin/activity-log - Get detailed activity log
router.get('/activity-log', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, staffId, actionType, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (staffId) {
      whereConditions.push(`sal.staff_id = $${++paramCount}`);
      params.push(staffId);
    }

    if (actionType) {
      whereConditions.push(`sal.action_type = $${++paramCount}`);
      params.push(actionType);
    }

    if (startDate) {
      whereConditions.push(`DATE(sal.created_at) >= $${++paramCount}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`DATE(sal.created_at) <= $${++paramCount}`);
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const query = `
      SELECT
        sal.*,
        u.first_name,
        u.last_name,
        u.branch
      FROM Staff_Actions_Log sal
      JOIN Users u ON sal.staff_id = u.user_id
      ${whereClause}
      ORDER BY sal.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM Staff_Actions_Log sal
      JOIN Users u ON sal.staff_id = u.user_id
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)) // Remove limit and offset for count
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      activities: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ message: 'Error fetching activity log' });
  }
});

module.exports = router;