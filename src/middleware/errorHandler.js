import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Request error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle specific error types
  if (err.type === 'redis') {
    return res.status(503).json({
      success: false,
      error: 'Database temporarily unavailable',
      code: 'REDIS_ERROR',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { details: err.message })
    });
  }

  if (err.type === 'openai') {
    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable',
      code: 'OPENAI_ERROR',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { details: err.message })
    });
  }

  if (err.type === 'validation') {
    const statusCode = Number.isInteger(err.status) ? err.status : 400;
    return res.status(statusCode).json({
      success: false,
      error: 'Invalid request data',
      code: 'VALIDATION_ERROR',
      details: err.details || err.message,
      timestamp: new Date().toISOString()
    });
  }

  if (err.type === 'rate_limit') {
    const statusCode = Number.isInteger(err.status) ? err.status : 429;
    return res.status(statusCode).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter || 60,
      timestamp: new Date().toISOString()
    });
  }

  // Handle HTTP status errors
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.message || 'Request failed',
      code: err.code || 'HTTP_ERROR',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: err.stack })
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { 
      message: err.message,
      stack: err.stack 
    })
  });
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper - catches errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error with type
 */
export const createError = (message, type = 'general', status = 500, details = null) => {
  const error = new Error(message);
  error.type = type;
  error.status = status;
  if (details) error.details = details;
  return error;
};
