// Environment detection utility for client side
export const Environment = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
  
  // Vite provides these automatically:
  // import.meta.env.DEV - true in development
  // import.meta.env.PROD - true in production
  // import.meta.env.MODE - 'development' or 'production'
  
  // You can also add custom environment variables in .env.client
  // They must be prefixed with REACT_APP_ to be available in client
  getClientVar: (key: string) => {
    return import.meta.env[`REACT_APP_${key}`];
  }
};

// Example usage:
export const config = {
  // Note: In Wasp, the API URL is automatically configured via WASP_SERVER_URL
  // This is primarily for reference. Wasp handles API calls internally.
  apiUrl: Environment.isDevelopment 
    ? 'http://localhost:3001'
    : (Environment.getClientVar('API_URL') || 'https://micro-banana-server-production.up.railway.app'),
    
  enableDebugLogs: Environment.isDevelopment,
  
  // For development, use dummy email provider (already configured in main.wasp)
  emailProvider: Environment.isDevelopment ? 'dummy' : 'production'
};
