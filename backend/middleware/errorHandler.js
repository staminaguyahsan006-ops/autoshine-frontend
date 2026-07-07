require('dotenv').config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// notFound — Handles unmatched routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// globalErrorHandler — Centralized error handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function globalErrorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'SERVER_ERROR';

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errorCode = 'INVALID_ID';
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
    errorCode = 'DUPLICATE_KEY';
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Log in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error('━━━━ ERROR ━━━━');
    console.error('Status:', statusCode);
    console.error('Message:', message);
    console.error('Stack:', err.stack);
    console.error('━━━━━━━━━━━━━━━');
  }

  const errorResponse = {
    success: false,
    error: {
      message: message,
      code: errorCode,
      statusCode: statusCode
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// asyncHandler — Wraps async route handlers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  globalErrorHandler,
  asyncHandler
};

