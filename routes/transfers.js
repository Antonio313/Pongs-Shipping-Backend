const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

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

// Admin middleware - Allow roles that can manage transfers
const requireAdmin = (req, res, next) => {
  const transferRoles = ['A', 'S', 'H', 'D']; // Admin, Super Admin, Package Handler, Transfer Personnel
  if (!transferRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Transfer management access required' });
  }
  next();
};

// GET /transfers - Get all transfer lists
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT
        t.transfer_id,
        t.destination,
        t.status,
        t.notes,
        t.created_at,
        t.updated_at,
        t.created_by,
        u.first_name || ' ' || u.last_name as created_by_name,
        COUNT(tp.package_id) as package_count
      FROM transfers t
      LEFT JOIN users u ON t.created_by = u.user_id
      LEFT JOIN transfer_packages tp ON t.transfer_id = tp.transfer_id
      GROUP BY t.transfer_id, u.first_name, u.last_name
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: 'Error fetching transfers' });
  }
});

// GET /transfers/:id - Get transfer by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        t.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM transfers t
      LEFT JOIN users u ON t.created_by = u.user_id
      WHERE t.transfer_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({ message: 'Error fetching transfer' });
  }
});

// GET /transfers/:id/packages - Get packages in a transfer
router.get('/:id/packages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        p.*,
        u.first_name,
        u.last_name,
        tp.checked_off,
        tp.added_at
      FROM transfer_packages tp
      JOIN packages p ON tp.package_id = p.package_id
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE tp.transfer_id = $1
      ORDER BY tp.added_at
    `;

    const result = await pool.query(query, [id]);

    res.json({
      transfer_id: id,
      packages: result.rows
    });
  } catch (error) {
    console.error('Error fetching transfer packages:', error);
    res.status(500).json({ message: 'Error fetching transfer packages' });
  }
});

// POST /transfers - Create new transfer list
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { destination, packages, notes } = req.body;

    if (!destination || !packages || packages.length === 0) {
      return res.status(400).json({ message: 'Destination and packages are required' });
    }

    await client.query('BEGIN');

    // Create transfer
    const transferQuery = `
      INSERT INTO transfers (destination, status, notes, created_by, created_at)
      VALUES ($1, 'created', $2, $3, NOW())
      RETURNING transfer_id
    `;

    const transferResult = await client.query(transferQuery, [destination, notes || null, req.user.userId]);
    const transferId = transferResult.rows[0].transfer_id;

    // Add packages to transfer
    for (const packageId of packages) {
      const packageQuery = `
        INSERT INTO transfer_packages (transfer_id, package_id, checked_off, added_at)
        VALUES ($1, $2, false, NOW())
      `;
      await client.query(packageQuery, [transferId, packageId]);
    }

    await client.query('COMMIT');

    // Track staff performance for transfer creation
    if (req.user.role === 'A' || req.user.role === 'S') {
      // Log the action
      await logStaffAction(
        req.user.userId,
        'transfer_creation',
        'transfer',
        transferId,
        `Created transfer list to ${destination} with ${packages.length} packages`,
        0,
        { destination, packageCount: packages.length, packages, notes }
      );

      // Update staff performance metrics
      await updateStaffPerformance(req.user.userId, {
        transfers_created: 1
      });
    }

    res.status(201).json({
      message: 'Transfer list created successfully',
      transfer_id: transferId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating transfer:', error);
    res.status(500).json({ message: 'Error creating transfer' });
  } finally {
    client.release();
  }
});

// PATCH /transfers/:id/status - Update transfer status
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['created', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const query = `
      UPDATE transfers
      SET status = $1, updated_at = NOW()
      WHERE transfer_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    res.json({
      message: 'Transfer status updated successfully',
      transfer: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating transfer status:', error);
    res.status(500).json({ message: 'Error updating transfer status' });
  }
});

// PATCH /transfers/:transferId/packages/:packageId/checkoff - Update package checkoff status
router.patch('/:transferId/packages/:packageId/checkoff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { transferId, packageId } = req.params;
    const { checked_off } = req.body;

    const query = `
      UPDATE transfer_packages
      SET checked_off = $1
      WHERE transfer_id = $2 AND package_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [checked_off, transferId, packageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transfer package not found' });
    }

    res.json({
      message: 'Package checkoff status updated successfully',
      transfer_package: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating package checkoff:', error);
    res.status(500).json({ message: 'Error updating package checkoff status' });
  }
});

// DELETE /transfers/:id - Delete transfer (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Delete transfer packages first
    await client.query('DELETE FROM transfer_packages WHERE transfer_id = $1', [id]);

    // Delete transfer
    const result = await client.query('DELETE FROM transfers WHERE transfer_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Transfer not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Transfer deleted successfully',
      transfer: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting transfer:', error);
    res.status(500).json({ message: 'Error deleting transfer' });
  } finally {
    client.release();
  }
});

module.exports = router;