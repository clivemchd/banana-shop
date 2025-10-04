import { HttpError } from 'wasp/server';
import { AppError } from './custom-errors';
import { logger, LogContext } from './logger';
import { Environment } from './environment';

/**
 * Safe error messages shown to users (no internal details)
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'Please log in to continue',
  UNAUTHORIZED: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INSUFFICIENT_CREDITS: 'You do not have enough credits for this operation',
  VALIDATION_ERROR: 'Invalid input provided',
  EXTERNAL_API_ERROR: 'An external service is temporarily unavailable. Please try again later',
  DATABASE_ERROR: 'A database error occurred. Please try again later',
  CONFIGURATION_ERROR: 'A system configuration error occurred. Please contact support',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  STORAGE_ERROR: 'File storage error occurred. Please try again later',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again later',
};

/**
 * Handle and sanitize errors for client response
 * 
 * This function:
 * 1. Logs detailed errors server-side
 * 2. Returns safe, user-friendly messages to clients
 * 3. Preserves HTTP status codes
 * 4. Masks sensitive information
 * 
 * @param error - Original error
 * @param context - Additional context for logging
 * @returns HttpError safe for client consumption
 */
export function handleError(error: unknown, context?: LogContext): HttpError {
  // If it's already an HttpError, log and return as-is
  if (error instanceof HttpError) {
    logger.warn('HttpError thrown', {
      ...context,
      statusCode: error.statusCode,
      message: error.message,
    });
    return error;
  }

  // If it's our custom AppError, convert to safe HttpError
  if (error instanceof AppError) {
    // Log the error with full details
    logger.error(error.message, {
      ...context,
      errorCode: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    }, error);

    // Return safe message to client
    const safeMessage = getSafeErrorMessage(error);
    return new HttpError(error.statusCode, safeMessage);
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Log the unexpected error
    logger.error('Unexpected error occurred', {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
    }, error);

    // Return generic safe message
    return new HttpError(500, SAFE_ERROR_MESSAGES.GENERIC_ERROR);
  }

  // Handle unknown error types
  logger.error('Unknown error type', {
    ...context,
    error: String(error),
  });

  return new HttpError(500, SAFE_ERROR_MESSAGES.GENERIC_ERROR);
}

/**
 * Get a safe error message based on the error code
 * In development, include more details for debugging
 */
function getSafeErrorMessage(error: AppError): string {
  const baseMessage = SAFE_ERROR_MESSAGES[error.code] || SAFE_ERROR_MESSAGES.GENERIC_ERROR;

  // In development, append error code for debugging
  if (Environment.isDevelopment) {
    return `${baseMessage} [${error.code}]`;
  }

  // Special handling for specific errors that can show details
  if (error.code === 'INSUFFICIENT_CREDITS') {
    return error.message; // This is safe to show - user needs to know exact amounts
  }

  if (error.code === 'VALIDATION_ERROR') {
    return error.message; // Validation messages are safe and helpful
  }

  return baseMessage;
}

/**
 * Async error handler wrapper for Wasp operations
 * Automatically catches and handles errors
 * 
 * Usage:
 * ```
 * export const myOperation = asyncErrorHandler(async (args, context) => {
 *   // Your operation code
 *   throw new InsufficientCreditsError(10, 5);
 * }, 'myOperation');
 * ```
 */
export function asyncErrorHandler<TArgs, TResult>(
  operation: (args: TArgs, context: any) => Promise<TResult>,
  operationName: string
) {
  return async (args: TArgs, context: any): Promise<TResult> => {
    try {
      return await operation(args, context);
    } catch (error) {
      const logContext: LogContext = {
        operation: operationName,
        userId: context?.user?.id,
      };
      
      throw handleError(error, logContext);
    }
  };
}

/**
 * Sync error handler wrapper
 */
export function syncErrorHandler<TArgs, TResult>(
  operation: (args: TArgs, context: any) => TResult,
  operationName: string
) {
  return (args: TArgs, context: any): TResult => {
    try {
      return operation(args, context);
    } catch (error) {
      const logContext: LogContext = {
        operation: operationName,
        userId: context?.user?.id,
      };
      
      throw handleError(error, logContext);
    }
  };
}
