/**
 * Authentication Configuration Utility
 * 
 * This utility helps manage authentication methods based on environment variables.
 * Set REACT_APP_ENABLE_TRADITIONAL_AUTH=true to enable email/password authentication
 * Set REACT_APP_ENABLE_TRADITIONAL_AUTH=false to use Google OAuth only
 */

export const AuthConfig = {
  /**
   * Check if traditional email/password authentication is enabled
   */
  isTraditionalAuthEnabled: (): boolean => {
    return import.meta.env.REACT_APP_ENABLE_TRADITIONAL_AUTH === 'true';
  },

  /**
   * Check if Google OAuth is enabled (always true for now)
   */
  isGoogleAuthEnabled: (): boolean => {
    return true;
  },

  /**
   * Get the configured authentication methods
   */
  getEnabledAuthMethods: (): string[] => {
    const methods: string[] = [];
    
    if (AuthConfig.isGoogleAuthEnabled()) {
      methods.push('google');
    }
    
    if (AuthConfig.isTraditionalAuthEnabled()) {
      methods.push('email');
    }
    
    return methods;
  }
};
