const config = require('../config/config');

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        details: `Maximum file size is ${config.upload.maxFileSize / 1024 / 1024}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        details: 'Maximum number of files exceeded',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
        details: 'Invalid file field name',
      });
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message,
    });
  }

  // Handle Replicate API errors
  if (err.message && err.message.includes('replicate')) {
    return res.status(500).json({
      success: false,
      error: 'Replicate API error',
      details: config.server.nodeEnv === 'development' ? err.message : 'Service temporarily unavailable',
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
}; 