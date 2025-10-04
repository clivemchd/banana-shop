/**
 * Custom error types for semantic error handling
 * These errors are internally used and get converted to safe HttpErrors
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', 401);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

/**
 * Resource errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

/**
 * Business logic errors
 */
export class InsufficientCreditsError extends AppError {
  constructor(
    public readonly required: number,
    public readonly available: number
  ) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_CREDITS',
      402
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * External service errors
 */
export class ExternalAPIError extends AppError {
  constructor(
    public readonly service: string,
    message: string,
    public readonly originalError?: Error
  ) {
    super(`${service} API error: ${message}`, 'EXTERNAL_API_ERROR', 503);
  }
}

export class ImageGenerationError extends ExternalAPIError {
  constructor(message: string, originalError?: Error) {
    super('Image Generation Service', message, originalError);
  }
}

export class PaymentProcessingError extends ExternalAPIError {
  constructor(message: string, originalError?: Error) {
    super('Payment Service', message, originalError);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500, false); // Not operational - might need restart
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500, false);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

/**
 * File/Storage errors
 */
export class StorageError extends AppError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'STORAGE_ERROR', 500);
  }
}
