import { Environment } from './environment';

/**
 * Context information for structured logging
 */
export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log data
 */
interface LogData {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
  context?: LogContext;
  errorName?: string;
  errorMessage?: string;
  stack?: string;
}

/**
 * Production-safe logger with Sentry integration
 * 
 * Development: Logs to console with colors
 * Production: Sends to Sentry for error tracking
 */
class Logger {
  private isDev = Environment.isDevelopment;
  private sentryInitialized = false;

  /**
   * Initialize Sentry if DSN is available
   */
  private async initSentry(): Promise<void> {
    if (this.sentryInitialized || this.isDev) return;

    try {
      const sentryDsn = process.env.SENTRY_DSN;
      if (!sentryDsn) return;

      // Dynamically import Sentry only in production
      const Sentry = await import('@sentry/node');
      
      Sentry.init({
        dsn: sentryDsn,
        environment: Environment.nodeEnv,
        tracesSampleRate: 0.1, // Sample 10% of transactions for performance monitoring
        
        // Filter out sensitive data
        beforeSend(event) {
          // Remove sensitive headers
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          return event;
        },
      });

      this.sentryInitialized = true;
    } catch (error) {
      // Fail silently if Sentry can't be initialized
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Log error with full context
   * 
   * @param message - Human-readable error message
   * @param context - Additional context (userId, operation, etc.)
   * @param error - Original error object
   */
  error(message: string, context?: LogContext, error?: Error): void {
    const logData: LogData = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      environment: Environment.nodeEnv,
      context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      }),
    };

    if (this.isDev) {
      // Development: Console output with colors
      console.error('🔴 ERROR:', message);
      if (context) console.error('📋 Context:', context);
      if (error) console.error('⚠️  Error:', error);
    } else {
      // Production: Send to Sentry and structured logs
      this.sendToProduction(logData, error);
    }
  }

  /**
   * Log warning
   * 
   * @param message - Warning message
   * @param context - Additional context
   */
  warn(message: string, context?: LogContext): void {
    const logData: LogData = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      environment: Environment.nodeEnv,
      context,
    };

    if (this.isDev) {
      console.warn('🟡 WARN:', message);
      if (context) console.warn('📋 Context:', context);
    } else {
      // Production: Structured logging for Railway/other platforms
      console.warn(JSON.stringify(logData));
    }
  }

  /**
   * Log info (operational messages)
   * 
   * @param message - Info message
   * @param context - Additional context
   */
  info(message: string, context?: LogContext): void {
    const logData: LogData = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      environment: Environment.nodeEnv,
      context,
    };

    if (this.isDev) {
      console.log('ℹ️  INFO:', message);
      if (context) console.log('📋 Context:', context);
    } else {
      // Production: Structured logging
      console.log(JSON.stringify(logData));
    }
  }

  /**
   * Log debug (verbose development info)
   * Only logs in development
   * 
   * @param message - Debug message
   * @param context - Additional context
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log('🔍 DEBUG:', message);
      if (context) console.log('📋 Context:', context);
    }
    // Never log debug in production
  }

  /**
   * Send logs to production services
   */
  private async sendToProduction(logData: LogData, error?: Error): Promise<void> {
    try {
      // Initialize Sentry if not already done
      await this.initSentry();

      if (this.sentryInitialized && error) {
        const Sentry = await import('@sentry/node');
        
        // Set context for Sentry
        if (logData.context) {
          Sentry.setContext('additional_context', logData.context);
          
          // Set user context if userId is available
          if (logData.context.userId) {
            Sentry.setUser({ id: logData.context.userId as string });
          }
        }

        // Capture exception in Sentry
        Sentry.captureException(error, {
          level: 'error',
          tags: {
            operation: logData.context?.operation as string,
          },
        });
      }

      // Also log as structured JSON for Railway/platform logs
      console.error(JSON.stringify(logData));
    } catch (loggingError) {
      // Fail silently - don't let logging errors break the app
      console.error('Logging failed:', loggingError);
    }
  }

  /**
   * Flush pending Sentry events (useful before process exit)
   */
  async flush(): Promise<void> {
    if (this.sentryInitialized && !this.isDev) {
      try {
        const Sentry = await import('@sentry/node');
        await Sentry.close(2000); // Wait up to 2 seconds
      } catch (error) {
        // Ignore flush errors
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();
