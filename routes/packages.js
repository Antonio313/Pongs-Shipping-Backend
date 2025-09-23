const express = require('express');
const Package = require('../models/Package');
const PreAlert = require('../models/PreAlert');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');
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

// Get all packages for the authenticated user
router.get('/my-packages', authenticateToken, async (req, res) => {
  try {
    const packages = await Package.findByUserId(req.user.user_id);
    res.status(200).json(packages);
  } catch (error) {
    console.error('Error fetching user packages:', error);
    res.status(500).json({ message: 'Error fetching packages', error: error.message });
  }
});

// Get all packages (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const filters = {
      status: req.query.status,
      branch: req.query.branch,
      user_id: req.query.user_id
    };

    const packages = await Package.findAll(filters);
    res.status(200).json(packages);
  } catch (error) {
    console.error('Error fetching all packages:', error);
    res.status(500).json({ message: 'Error fetching packages', error: error.message });
  }
});

// Get package by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Check if user owns the package or is admin/super admin
    if (package.user_id !== req.user.user_id && req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(package);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ message: 'Error fetching package', error: error.message });
  }
});

// Get package by tracking number with tracking history (public endpoint)
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const package = await Package.findByTrackingNumber(req.params.trackingNumber);

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Get tracking history from PackageTracking table (excluding location as it will be null)
    const trackingHistoryResult = await pool.query(
      `SELECT pt.status, pt.notes, pt.created_at, u.first_name, u.last_name
       FROM packagetracking pt
       LEFT JOIN users u ON pt.created_by = u.user_id
       WHERE pt.package_id = $1
       ORDER BY pt.created_at DESC`,
      [package.package_id]
    );

    const trackingHistory = trackingHistoryResult.rows.map(row => ({
      status: row.status,
      notes: row.notes,
      timestamp: row.created_at,
      updated_by: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : 'System'
    }));

    // Return enhanced tracking information
    const trackingInfo = {
      tracking_number: package.tracking_number,
      status: package.status,
      description: package.description,
      created_at: package.created_at,
      updated_at: package.updated_at,
      tracking_history: trackingHistory
    };

    res.status(200).json(trackingInfo);
  } catch (error) {
    console.error('Error fetching package by tracking:', error);
    res.status(500).json({ message: 'Error fetching package', error: error.message });
  }
});

// Create new package (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const { user_id, description, weight, length, width, height, cost, status } = req.body;
    
    const newPackage = await Package.create({
      user_id,
      description,
      weight,
      length,
      width,
      height,
      cost,
      status
    });

    res.status(201).json({
      message: 'Package created successfully',
      package: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ message: 'Error creating package', error: error.message });
  }
});

// Confirm prealert and create package (admin only)
router.post('/confirm-prealert/:prealertId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const { weight, length, width, height, cost, status } = req.body;
    
    // Get the prealert
    const prealert = await PreAlert.findById(req.params.prealertId);
    if (!prealert) {
      return res.status(404).json({ message: 'PreAlert not found' });
    }

    if (prealert.status === 'C') {
      return res.status(400).json({ message: 'PreAlert already confirmed' });
    }

    // Create the package using prealert data
    const newPackage = await Package.create({
      user_id: prealert.user_id,
      description: prealert.description,
      weight,
      length,
      width,
      height,
      cost: cost || prealert.price,
      status: status || 'Processing'
    });

    // Update prealert status and link to package
    const updatedPreAlert = await PreAlert.confirmPrealert(req.params.prealertId, newPackage.package_id);

    // Get user information for email
    const packageWithUser = await Package.findById(newPackage.package_id);

    // Send confirmation email to customer (exclude cost as requested)
    try {
      const emailTemplate = emailTemplates.prealertConfirmation(
        packageWithUser.first_name,
        newPackage.tracking_number,
        newPackage.status,
        newPackage.description
      );
      
      await sendEmail(
        packageWithUser.email,
        emailTemplate.subject,
        emailTemplate.html
      );
      
      console.log(`Pre-alert confirmation email sent to ${packageWithUser.email}`);
    } catch (emailError) {
      console.error('Error sending pre-alert confirmation email:', emailError);
      // Don't fail the request if email fails - log it and continue
    }

    // Track staff performance for prealert confirmation
    if (req.user.role === 'A' || req.user.role === 'S') {
      const packageCost = cost || prealert.price || 0;

      // Log the action (no revenue impact yet - revenue only tracked on delivery)
      await logStaffAction(
        req.user.user_id,
        'prealert_confirmation',
        'prealert',
        req.params.prealertId,
        `Confirmed prealert and created package ${newPackage.tracking_number}`,
        0, // No revenue impact - revenue is only generated on delivery
        {
          prealertId: req.params.prealertId,
          packageId: newPackage.package_id,
          trackingNumber: newPackage.tracking_number,
          cost: packageCost
        }
      );

      // Update staff performance metrics (no revenue tracked yet)
      await updateStaffPerformance(req.user.user_id, {
        packages_processed: 1,
        prealerts_confirmed: 1,
        revenue_generated: 0, // Revenue only tracked on delivery
        notifications_sent: 1 // Email was sent
      });
    }

    res.status(201).json({
      message: 'PreAlert confirmed and package created successfully',
      package: newPackage,
      prealert: updatedPreAlert
    });
  } catch (error) {
    console.error('Error confirming prealert:', error);
    res.status(500).json({ message: 'Error confirming prealert', error: error.message });
  }
});

// Update package (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const updatedPackage = await Package.update(req.params.id, req.body);
    
    res.status(200).json({
      message: 'Package updated successfully',
      package: updatedPackage
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: 'Error updating package', error: error.message });
  }
});

// Update package status and send email notification
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const { status, location, notes, finalCost, sendEmailNotification = true } = req.body;

    console.log(`Admin ${req.user.email} updating package ${req.params.id} to status: ${status}${finalCost ? `, final cost: $${finalCost}` : ''}`);

    const package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // If status is "Arrived in Jamaica" and finalCost is provided, update it
    if (status === 'Arrived in Jamaica' && finalCost !== undefined) {
      console.log(`Setting final cost for package ${req.params.id}: $${finalCost}`);
      // Update the package with final cost
      await pool.query(
        'UPDATE packages SET finalcost = $1, updated_at = CURRENT_TIMESTAMP WHERE package_id = $2',
        [finalCost, req.params.id]
      );
    }

    const updatedPackage = await Package.updateStatus(
      req.params.id,
      status,
      location,
      notes,
      req.user.user_id
    );

    // Send email notification to customer if requested
    if (sendEmailNotification) {
      try {
        let emailTemplate;

        // Special email template for "Arrived in Jamaica" with final cost
        if (status === 'Arrived in Jamaica' && finalCost !== undefined) {
          emailTemplate = emailTemplates.arrivedInJamaicaWithCost(
            package.first_name,
            package.tracking_number,
            package.description,
            finalCost,
            package.branch || 'your selected branch'
          );
        } else {
          // Standard status update email
          emailTemplate = emailTemplates.statusUpdate(
            package.first_name,
            package.tracking_number,
            status,
            package.description
          );
        }

        await sendEmail(
          package.email,
          emailTemplate.subject,
          emailTemplate.html
        );

        console.log(`Status update email sent to ${package.email} for package ${package.tracking_number}`);

      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log('Email notification skipped as requested');
    }

    // Get the updated package with final cost
    const finalPackage = await Package.findById(req.params.id);

    // Track staff performance for package processing
    if (req.user.role === 'A' || req.user.role === 'S') {
      const packageCost = finalCost || finalPackage.finalcost || finalPackage.cost || 0;

      // Log the action (no revenue impact yet - revenue only tracked on delivery)
      await logStaffAction(
        req.user.user_id,
        'package_status_update',
        'package',
        req.params.id,
        `Updated package ${finalPackage.tracking_number} status to ${status}`,
        0, // No revenue impact - revenue is only generated on delivery
        { status, previousStatus: package.status, finalCost, location, notes, packageCost }
      );

      // Update staff performance metrics (no revenue tracked yet)
      await updateStaffPerformance(req.user.user_id, {
        packages_processed: 1,
        revenue_generated: 0, // Revenue only tracked on delivery
        notifications_sent: sendEmailNotification ? 1 : 0
      });
    }

    res.status(200).json({
      message: 'Package status updated successfully',
      package: finalPackage,
      emailSent: sendEmailNotification
    });
  } catch (error) {
    console.error('Error updating package status:', error);
    res.status(500).json({ message: 'Error updating package status', error: error.message });
  }
});

// Delete package (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const deletedPackage = await Package.delete(req.params.id);
    
    res.status(200).json({
      message: 'Package deleted successfully',
      package: deletedPackage
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ message: 'Error deleting package', error: error.message });
  }
});

// Get packages by status
router.get('/status/:status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['Processing', 'Delivered to Overseas Warehouse', 'In Transit to Jamaica', 'Arrived in Jamaica', 'Arrived at Selected Branch', 'Ready For Pickup', 'Out For Delivery', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // For non-admin users, only return their own packages
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      const packages = await Package.findByUserId(req.user.user_id);
      const filteredPackages = packages.filter(pkg => pkg.status === status);
      return res.status(200).json(filteredPackages);
    }

    // For admin users, return all packages with the specified status
    const packages = await Package.findByStatus(status);
    res.status(200).json(packages);
  } catch (error) {
    console.error('Error fetching packages by status:', error);
    res.status(500).json({ message: 'Error fetching packages', error: error.message });
  }
});

// Send package notification to customer (admin only)
router.post('/notify-customer/:customerId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== 'A' && req.user.role !== 'S') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const { customerId } = req.params;
    const { description, weight, tracking_number, carrier, notes } = req.body;

    // Get customer details
    const customerResult = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = customerResult.rows[0];

    // Send urgent notification email using the new template
    try {
      const emailTemplate = emailTemplates.missingPreAlert(
        customer.first_name,
        {
          description,
          weight,
          tracking_number,
          carrier,
          notes
        }
      );
      
      await sendEmail(
        customer.email,
        emailTemplate.subject,
        emailTemplate.html
      );

      // Also log this notification in the database
      await pool.query(
        `INSERT INTO packagenotifications
         (user_id, admin_id, description, weight, tracking_number, carrier, notes, notification_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [customerId, req.user.user_id, description, weight, tracking_number, carrier, notes, 'missing_prealert']
      );

      // Track staff performance for customer notification
      if (req.user.role === 'A' || req.user.role === 'S') {
        await logStaffAction(
          req.user.user_id,
          'customer_notification',
          'customer',
          customerId,
          `Sent package notification to ${customer.first_name} ${customer.last_name} for tracking ${tracking_number}`,
          0,
          {
            customer_name: `${customer.first_name} ${customer.last_name}`,
            customer_email: customer.email,
            tracking_number: tracking_number,
            description: description,
            carrier: carrier,
            notification_type: 'missing_prealert'
          }
        );

        await updateStaffPerformance(req.user.user_id, {
          notifications_sent: 1
        });
      }

      res.status(200).json({
        message: 'Urgent notification sent successfully',
        customer: {
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email
        }
      });

    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      res.status(500).json({ 
        message: 'Notification created but email failed to send',
        error: emailError.message 
      });
    }

  } catch (error) {
    console.error('Error sending package notification:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
});

module.exports = router;