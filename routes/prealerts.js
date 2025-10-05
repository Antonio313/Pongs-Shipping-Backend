const express = require('express');
const PreAlert = require('../models/PreAlert');
const { authenticateToken, authenticateTokenRequireVerified, requireAdmin, requireRole } = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const s3Service = require('../services/s3Service');
const router = express.Router();

// Get all prealerts for the authenticated user
router.get('/my-prealerts', authenticateToken, async (req, res) => {
  try {
    const prealerts = await PreAlert.findByUserId(req.user.user_id);
    res.status(200).json(prealerts);
  } catch (error) {
    console.error('Error fetching user prealerts:', error);
    res.status(500).json({ message: 'Error fetching prealerts', error: error.message });
  }
});

// Get all prealerts (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {

    const prealerts = await PreAlert.findAll();
    res.status(200).json(prealerts);
  } catch (error) {
    console.error('Error fetching all prealerts:', error);
    res.status(500).json({ message: 'Error fetching prealerts', error: error.message });
  }
});

// Get prealert by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const prealert = await PreAlert.findById(req.params.id);
    
    if (!prealert) {
      return res.status(404).json({ message: 'PreAlert not found' });
    }

    // Check if user owns the prealert or is staff
    const staffRoles = ['A', 'S', 'H', 'T', 'D', 'F'];
    if (prealert.user_id !== req.user.user_id && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(prealert);
  } catch (error) {
    console.error('Error fetching prealert:', error);
    res.status(500).json({ message: 'Error fetching prealert', error: error.message });
  }
});

// Create new prealert with receipt upload
router.post('/', authenticateToken, uploadSingle('receipt'), async (req, res) => {
  try {
    const { description, price, tracking_number, carrier } = req.body;
    let invoice_url = null;
    let s3_key = null;

    // Validate required fields
    if (!description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Description and price are required'
      });
    }

    // Validate price
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number'
      });
    }

    // Handle file upload if provided
    if (req.file) {
      try {
        const uploadResult = await s3Service.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'receipts'
        );

        invoice_url = uploadResult.url;
        s3_key = uploadResult.key;
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload receipt file'
        });
      }
    }

    // Create prealert with S3 information
    const newPreAlert = await PreAlert.create({
      user_id: req.user.user_id,
      description,
      price: priceNumber,
      invoice_url,
      s3_key, // Store S3 key for future operations
      status: 'U', // Unconfirmed by default
      tracking_number: tracking_number || null,
      carrier: carrier || null
    });

    res.status(201).json({
      success: true,
      message: 'PreAlert created successfully',
      prealert: newPreAlert
    });
  } catch (error) {
    console.error('Error creating prealert:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prealert',
      error: error.message
    });
  }
});

// Update prealert with optional receipt upload
router.put('/:id', authenticateToken, uploadSingle('receipt'), async (req, res) => {
  try {
    const prealert = await PreAlert.findById(req.params.id);

    if (!prealert) {
      return res.status(404).json({
        success: false,
        message: 'PreAlert not found'
      });
    }

    // Check if user owns the prealert or is staff
    const staffRoles = ['A', 'S', 'H', 'T', 'D', 'F'];
    if (prealert.user_id !== req.user.user_id && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow customers to update unconfirmed prealerts
    if (req.user.role === 'C' && prealert.status === 'C') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update confirmed prealert'
      });
    }

    const updateData = { ...req.body };
    let oldS3Key = null;

    // Handle new file upload
    if (req.file) {
      try {
        // Store old S3 key for cleanup
        if (prealert.s3_key) {
          oldS3Key = prealert.s3_key;
        }

        // Upload new file
        const uploadResult = await s3Service.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'receipts'
        );

        updateData.invoice_url = uploadResult.url;
        updateData.s3_key = uploadResult.key;
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload new receipt file'
        });
      }
    }

    // Validate price if provided
    if (updateData.price) {
      const priceNumber = parseFloat(updateData.price);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid positive number'
        });
      }
      updateData.price = priceNumber;
    }

    const updatedPreAlert = await PreAlert.update(req.params.id, updateData);

    // Delete old file from S3 after successful update
    if (oldS3Key && req.file) {
      try {
        await s3Service.deleteFile(oldS3Key);
      } catch (deleteError) {
        console.warn('Failed to delete old receipt file:', deleteError);
        // Don't fail the request if deletion fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'PreAlert updated successfully',
      prealert: updatedPreAlert
    });
  } catch (error) {
    console.error('Error updating prealert:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating prealert',
      error: error.message
    });
  }
});

// Confirm prealert (admin only - link to package) - Package Handler, Admin, and Front Desk
router.patch('/:id/confirm', authenticateToken, requireRole(['A', 'S', 'H', 'F']), async (req, res) => {
  try {

    const { package_id } = req.body;
    
    if (!package_id) {
      return res.status(400).json({ message: 'Package ID is required for confirmation' });
    }

    const prealert = await PreAlert.findById(req.params.id);
    
    if (!prealert) {
      return res.status(404).json({ message: 'PreAlert not found' });
    }

    const confirmedPreAlert = await PreAlert.confirmPrealert(req.params.id, package_id);
    
    res.status(200).json({
      message: 'PreAlert confirmed successfully',
      prealert: confirmedPreAlert
    });
  } catch (error) {
    console.error('Error confirming prealert:', error);
    res.status(500).json({ message: 'Error confirming prealert', error: error.message });
  }
});

// Get receipt download URL
router.get('/:id/receipt', authenticateToken, async (req, res) => {
  try {
    const prealert = await PreAlert.findById(req.params.id);

    if (!prealert) {
      return res.status(404).json({
        success: false,
        message: 'PreAlert not found'
      });
    }

    // Check if user owns the prealert or is staff
    const staffRoles = ['A', 'S', 'H', 'T', 'D', 'F'];
    if (prealert.user_id !== req.user.user_id && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!prealert.s3_key) {
      return res.status(404).json({
        success: false,
        message: 'No receipt found for this prealert'
      });
    }

    try {
      // Generate presigned URL for secure download (expires in 1 hour)
      const downloadUrl = await s3Service.getPresignedUrl(prealert.s3_key, 3600);

      res.status(200).json({
        success: true,
        downloadUrl: downloadUrl,
        expiresIn: 3600 // 1 hour
      });
    } catch (s3Error) {
      console.error('S3 error generating download URL:', s3Error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate download URL'
      });
    }
  } catch (error) {
    console.error('Error getting receipt download URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting receipt',
      error: error.message
    });
  }
});

// Delete prealert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const prealert = await PreAlert.findById(req.params.id);

    if (!prealert) {
      return res.status(404).json({
        success: false,
        message: 'PreAlert not found'
      });
    }

    // Check if user owns the prealert or is staff
    const staffRoles = ['A', 'S', 'H', 'T', 'D', 'F'];
    if (prealert.user_id !== req.user.user_id && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow customers to delete unconfirmed prealerts
    if (req.user.role === 'C' && prealert.status === 'C') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete confirmed prealert'
      });
    }

    // Delete from database first
    const deletedPreAlert = await PreAlert.delete(req.params.id);

    // Delete associated file from S3 if exists
    if (prealert.s3_key) {
      try {
        await s3Service.deleteFile(prealert.s3_key);
      } catch (s3Error) {
        console.warn('Failed to delete receipt file from S3:', s3Error);
        // Don't fail the request if S3 deletion fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'PreAlert deleted successfully',
      prealert: deletedPreAlert
    });
  } catch (error) {
    console.error('Error deleting prealert:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting prealert',
      error: error.message
    });
  }
});

// Get prealerts by status
router.get('/status/:status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['C', 'U'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use "C" for confirmed or "U" for unconfirmed.' });
    }

    // For non-staff users, only return their own prealerts
    const staffRoles = ['A', 'S', 'H', 'T', 'D', 'F'];
    if (!staffRoles.includes(req.user.role)) {
      const prealerts = await PreAlert.findByUserId(req.user.user_id);
      const filteredPrealerts = prealerts.filter(pa => pa.status === status);
      return res.status(200).json(filteredPrealerts);
    }

    // For admin users, return all prealerts with the specified status
    const prealerts = await PreAlert.findByStatus(status);
    res.status(200).json(prealerts);
  } catch (error) {
    console.error('Error fetching prealerts by status:', error);
    res.status(500).json({ message: 'Error fetching prealerts', error: error.message });
  }
});

module.exports = router;