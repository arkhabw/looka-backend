import { errorResponse } from '../utils/response.js';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, {
    statusCode: 404,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Centralized Global Error Handler
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('[ERROR] Unhandled Error:', err);

  // PostgreSQL unique violation error (e.g. duplicate email)
  if (err.code === '23505') {
    return errorResponse(res, {
      statusCode: 400,
      message: 'Duplicate entry detected. Resource already exists.',
      errors: err.detail || err.message,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return errorResponse(res, {
      statusCode: 400,
      message: 'Invalid foreign key reference.',
      errors: err.detail || err.message,
    });
  }

  // Syntax / Invalid JSON body error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, {
      statusCode: 400,
      message: 'Malformed JSON payload.',
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid authorization token.',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Authorization token has expired.',
    });
  }

  // Zod Validation Error (if passed to next(err))
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors?.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, {
      statusCode: 400,
      message: 'Validation failed.',
      errors: formattedErrors,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, {
    statusCode,
    message,
    errors: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
