// lib/error-handler.js
/**
 * Standardized error handling and response formatting
 */

/**
 * Standard API error response
 */
export function createErrorResponse(error, statusCode = 500, additionalInfo = {}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  const response = {
    error: error.message || "An error occurred",
    ...additionalInfo,
  };

  // Include stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  return {
    status: statusCode,
    body: response,
  };
}

/**
 * Standard success response
 */
export function createSuccessResponse(data, statusCode = 200, message = null) {
  const response = { ...data };
  if (message) {
    response.message = message;
  }
  return {
    status: statusCode,
    body: response,
  };
}

/**
 * Handle async route errors
 */
export function asyncHandler(fn) {
  return async (req, res, ...args) => {
    try {
      return await fn(req, res, ...args);
    } catch (error) {
      console.error("Route error:", error);
      const errorResponse = createErrorResponse(
        error,
        error.statusCode || 500,
        { path: req.url }
      );
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.field = field;
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends Error {
  constructor(resource = "Resource") {
    super(`${resource} not found`);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

