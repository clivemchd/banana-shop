// Re-export utilities for easy access
export { Environment } from './environment';
export { logger } from './logger';
export { handleError, asyncErrorHandler, syncErrorHandler } from './error-handler';
export * from './custom-errors';

// Helper function for requiring environment variables (backwards compatibility)
export function requireNodeEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}