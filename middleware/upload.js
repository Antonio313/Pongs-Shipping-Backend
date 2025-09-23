const multer = require('multer');
const s3Service = require('../services/s3Service');

// Configure multer for memory storage (files will be uploaded to S3)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!s3Service.isValidReceiptFileType(file.mimetype)) {
    const error = new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and WebP files are allowed.');
    error.status = 400;
    return cb(error, false);
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file per upload
  },
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'receipt') => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File too large. Maximum size is 10MB.'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: 'Too many files. Only one file allowed.'
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: 'Unexpected file field. Please use the correct field name.'
            });
          }
        }

        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }

      // Validate file size using our service
      if (req.file && !s3Service.isValidFileSize(req.file.size)) {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      }

      next();
    });
  };
};

// Error handling middleware for upload errors
const handleUploadError = (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }

  next();
};

module.exports = {
  uploadSingle,
  handleUploadError
};