// Re-export utilities for easy access
export { Environment } from './environment';

// Helper function for requiring environment variables (backwards compatibility)
export function requireNodeEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}