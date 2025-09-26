// Environment detection utility for server side
export const Environment = {
  isDevelopment: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') || (typeof process === 'undefined') || !process?.env?.NODE_ENV,
  isProduction: typeof process !== 'undefined' && process.env.NODE_ENV === 'production',
  nodeEnv: (typeof process !== 'undefined' ? process.env.NODE_ENV : 'development') || 'development',
  
  // Access server environment variables
  getServerVar: (key: string, defaultValue?: string) => {
    if (typeof process === 'undefined') {
      return defaultValue || '';
    }
    return process.env[key] || defaultValue;
  },
  
  // Validate required environment variables
  requireVar: (key: string) => {
    if (typeof process === 'undefined') {
      throw new Error(`Environment variable ${key} is not available in client-side code`);
    }
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
};

// Example server configuration based on environment - use function to avoid immediate execution
export const getServerConfig = () => ({
  // Database settings
  database: {
    // Wasp handles this automatically, but you can override if needed
    logQueries: Environment.isDevelopment,
    connectionPoolSize: Environment.isProduction ? 20 : 5,
  },
  
  // API settings
  api: {
    enableCors: Environment.isDevelopment,
    rateLimit: Environment.isProduction ? 100 : 1000, // requests per minute
  },
  
  // External services
  fal: {
    apiKey: Environment.requireVar('FAL_KEY'),
    timeout: Environment.isProduction ? 30000 : 60000, // ms
  },
  
  google: {
    clientId: Environment.requireVar('GOOGLE_CLIENT_ID'),
    clientSecret: Environment.requireVar('GOOGLE_CLIENT_SECRET'),
  },
  
  // Logging
  logging: {
    level: Environment.isDevelopment ? 'debug' : 'info',
    enableConsole: Environment.isDevelopment,
  }
});
