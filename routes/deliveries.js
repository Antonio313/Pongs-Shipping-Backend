const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendDeliveryNotification } = require('../utils/emailService');

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
      [staffId, date, metrics.packages_processed || 0, metrics.transfers_created || 0,
       metrics.customers_added || 0, metrics.revenue_generated || 0,
       metrics.prealerts_confirmed || 0, metrics.notifications_sent || 0]
    );
  } catch (error) {
    console.error('Error updating staff performance:', error);
  }
};

// Get all packages ready for pickup grouped by customer
router.get('/ready-for-pickup', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT
        u.user_id,
        u.customer_number,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.address,
        u.branch,
        COUNT(p.package_id) as package_count,
        SUM(p.finalcost) as total_amount,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'package_id', p.package_id,
            'tracking_number', p.tracking_number,
            'weight', p.weight,
            'description', p.description,
            'finalcost', p.finalcost,
            'status', p.status,
            'created_at', p.created_at,
            'updated_at', p.updated_at
          ) ORDER BY p.updated_at DESC
        ) as packages
      FROM Users u
      JOIN Packages p ON u.user_id = p.user_id
      WHERE p.status = 'Ready For Pickup'
      GROUP BY u.user_id, u.customer_number, u.first_name, u.last_name, u.email, u.phone, u.address, u.branch
      ORDER BY u.last_name, u.first_name
    `;

    const result = await pool.query(query);
    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Error fetching ready for pickup packages:', error);
    res.status(500).json({ message: 'Failed to fetch packages ready for pickup' });
  }
});

// Deliver a package
router.post('/deliver/:packageId', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { packageId } = req.params;
    const { received_by, notes, payment_method = 'cash' } = req.body;
    const adminId = req.user.user_id;
    const deliveredAt = new Date();

    // Get package and customer details
    const packageQuery = `
      SELECT
        p.package_id,
        p.tracking_number,
        p.finalcost,
        p.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM Packages p
      JOIN Users u ON p.user_id = u.user_id
      WHERE p.package_id = $1 AND p.status = 'Ready For Pickup'
    `;

    const packageResult = await client.query(packageQuery, [packageId]);

    if (packageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Package not found or not ready for pickup' });
    }

    const packageData = packageResult.rows[0];

    // Update package status to 'Delivered'
    await client.query(
      'UPDATE Packages SET status = $1, updated_at = $2 WHERE package_id = $3',
      ['Delivered', deliveredAt, packageId]
    );

    // Insert delivery record
    const deliveryQuery = `
      INSERT INTO Deliveries (package_id, delivered_at, received_by, delivered_by, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING delivery_id
    `;

    const deliveryResult = await client.query(deliveryQuery, [
      packageId,
      deliveredAt,
      received_by,
      adminId,
      notes
    ]);

    // Insert package tracking record
    await client.query(
      `INSERT INTO PackageTracking (package_id, status, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [packageId, 'Delivered', `Package delivered to ${received_by}. ${notes || ''}`, adminId, deliveredAt]
    );

    // Create payment record
    const paymentQuery = `
      INSERT INTO Payments (user_id, amount, payment_method, status, transaction_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING payment_id
    `;

    const paymentResult = await client.query(paymentQuery, [
      packageData.user_id,
      packageData.finalcost,
      payment_method,
      'completed',
      `DEL-${packageId}-${Date.now()}`,
      deliveredAt
    ]);

    // Link package to payment
    await client.query(
      'INSERT INTO PackagePayments (package_id, payment_id, amount) VALUES ($1, $2, $3)',
      [packageId, paymentResult.rows[0].payment_id, packageData.finalcost]
    );

    await client.query('COMMIT');

    // Track staff performance for package delivery (only for admins)
    if (req.user.role === 'A' || req.user.role === 'S') {
      // Log the delivery action
      await logStaffAction(
        adminId,
        'package_delivery',
        'package',
        packageId,
        `Delivered package ${packageData.tracking_number} to ${received_by}`,
        parseFloat(packageData.finalcost || 0),
        {
          tracking_number: packageData.tracking_number,
          received_by: received_by,
          payment_method: payment_method,
          customer_id: packageData.user_id,
          customer_name: `${packageData.first_name} ${packageData.last_name}`,
          notes: notes
        }
      );

      // Update staff performance metrics
      await updateStaffPerformance(adminId, {
        packages_processed: 1,
        revenue_generated: parseFloat(packageData.finalcost || 0),
        notifications_sent: 1 // for the delivery notification email
      });
    }

    // Send email notification
    try {
      await sendDeliveryNotification({
        email: packageData.email,
        firstName: packageData.first_name,
        lastName: packageData.last_name,
        trackingNumber: packageData.tracking_number,
        deliveredAt: deliveredAt,
        receivedBy: received_by
      });
    } catch (emailError) {
      console.error('Failed to send delivery notification email:', emailError);
    }

    res.json({
      success: true,
      message: 'Package delivered successfully',
      delivery: {
        delivery_id: deliveryResult.rows[0].delivery_id,
        package_id: packageId,
        delivered_at: deliveredAt,
        received_by,
        amount_collected: packageData.finalcost
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error delivering package:', error);
    res.status(500).json({ message: 'Failed to deliver package' });
  } finally {
    client.release();
  }
});

// Get deliveries for today (end of day report)
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = `
      SELECT
        d.delivery_id,
        d.package_id,
        d.delivered_at,
        d.received_by,
        d.notes,
        p.tracking_number,
        p.finalcost,
        u.first_name,
        u.last_name,
        u.email,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name
      FROM Deliveries d
      JOIN Packages p ON d.package_id = p.package_id
      JOIN Users u ON p.user_id = u.user_id
      LEFT JOIN Users admin ON d.delivered_by = admin.user_id
      WHERE d.delivered_at >= $1 AND d.delivered_at < $2
      ORDER BY d.delivered_at DESC
    `;

    const result = await pool.query(query, [today, tomorrow]);

    const totalAmount = result.rows.reduce((sum, delivery) => {
      return sum + parseFloat(delivery.finalcost || 0);
    }, 0);

    res.json({
      deliveries: result.rows,
      summary: {
        total_deliveries: result.rows.length,
        total_amount: totalAmount,
        date: today.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error fetching today\'s deliveries:', error);
    res.status(500).json({ message: 'Failed to fetch today\'s deliveries' });
  }
});

// Get deliveries by admin for specific date range
router.get('/by-admin', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, admin_id } = req.query;

    let query = `
      SELECT
        d.delivery_id,
        d.package_id,
        d.delivered_at,
        d.received_by,
        p.tracking_number,
        p.finalcost,
        u.first_name,
        u.last_name,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name
      FROM Deliveries d
      JOIN Packages p ON d.package_id = p.package_id
      JOIN Users u ON p.user_id = u.user_id
      LEFT JOIN Users admin ON d.delivered_by = admin.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND d.delivered_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND d.delivered_at < $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (admin_id) {
      query += ` AND d.delivered_by = $${paramIndex}`;
      params.push(admin_id);
      paramIndex++;
    }

    query += ' ORDER BY d.delivered_at DESC';

    const result = await pool.query(query, params);

    const totalAmount = result.rows.reduce((sum, delivery) => {
      return sum + parseFloat(delivery.finalcost || 0);
    }, 0);

    res.json({
      deliveries: result.rows,
      summary: {
        total_deliveries: result.rows.length,
        total_amount: totalAmount
      }
    });

  } catch (error) {
    console.error('Error fetching deliveries by admin:', error);
    res.status(500).json({ message: 'Failed to fetch deliveries' });
  }
});

module.exports = router;