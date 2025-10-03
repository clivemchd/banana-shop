/**
 * Authentication Helper Functions
 * Common utilities for authentication across the application
 */

import { config } from './environment';

/**
 * Initiates Google OAuth sign-in flow
 * Uses the proper API URL from environment configuration
 */
export const initiateGoogleSignIn = (): void => {
  const apiUrl = config.apiUrl;
  const googleAuthUrl = `${apiUrl}/auth/google/login`;
  
  // Redirect to Google OAuth endpoint
  window.location.href = googleAuthUrl;
};

/**
 * Get the Google OAuth login URL
 * Useful for href attributes or programmatic redirects
 */
export const getGoogleAuthUrl = (): string => {
  const apiUrl = config.apiUrl;
  return `${apiUrl}/auth/google/login`;
};
