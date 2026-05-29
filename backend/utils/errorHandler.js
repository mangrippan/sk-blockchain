/**
 * Safe Error Response Utilities
 * Prevents leaking sensitive internal details in production
 */

const crypto = require('crypto');

/**
 * Generate a unique correlation ID for error tracking
 */
function generateCorrelationId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Sanitize error message for client response
 * In production, return generic message; in development, return actual error
 * 
 * @param {Error} error - The error object
 * @param {string} fallbackMessage - Generic fallback message
 * @returns {object} Safe error response
 */
function sanitizeError(error, fallbackMessage = 'Internal server error') {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const correlationId = generateCorrelationId();

  // Log full error details server-side
  console.error(`[${correlationId}] Error:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  // Return safe response to client
  const response = {
    error: fallbackMessage,
    correlationId,
  };

  // In development, include error details for debugging
  if (isDevelopment) {
    response.detail = error.message;
    response.stack = error.stack;
  } else {
    // In production, only include safe hint
    response.message = 'An error occurred. Please contact support with the correlation ID.';
  }

  return response;
}

/**
 * Express error handler middleware
 * Catches all unhandled errors and returns safe responses
 * 
 * Usage: Add as last middleware in server.js
 * app.use(globalErrorHandler);
 */
function globalErrorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const correlationId = generateCorrelationId();

  // Log full error with request context
  console.error(`[${correlationId}] Unhandled error:`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    user: req.user?.id,
    error: err.message,
    stack: err.stack,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send safe response
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: isDevelopment 
      ? err.message 
      : 'An unexpected error occurred. Please contact support.',
    correlationId,
    ...(isDevelopment && {
      detail: err.message,
      stack: err.stack,
    }),
  });
}

/**
 * Helper to create standardized error responses
 * 
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} errorType - Error type/category
 * @param {string} message - Error message
 * @param {Error} [originalError] - Original error for logging
 */
function sendError(res, statusCode, errorType, message, originalError = null) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const correlationId = generateCorrelationId();

  // Log error server-side
  if (originalError) {
    console.error(`[${correlationId}] ${errorType}:`, {
      message: originalError.message,
      stack: originalError.stack,
    });
  }

  // Send response
  res.status(statusCode).json({
    error: errorType,
    message: isDevelopment && originalError ? originalError.message : message,
    correlationId,
    ...(isDevelopment && originalError && {
      detail: originalError.message,
    }),
  });
}

module.exports = {
  sanitizeError,
  globalErrorHandler,
  sendError,
  generateCorrelationId,
};
