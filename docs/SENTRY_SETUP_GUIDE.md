# Sentry Integration Setup Guide

## Overview

This project now includes production-safe error logging with Sentry integration. All server errors are automatically logged to Sentry in production while preserving detailed console output in development.

## Setup Instructions

### 1. Install Sentry Package

```bash
npm install @sentry/node
```

### 2. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (or use existing)
3. Create a new project:
   - Platform: **Node.js**
   - Project name: **micro-banana** (or your project name)

### 3. Get Your Sentry DSN

After creating the project, Sentry will show you a **DSN** (Data Source Name). It looks like:

```
https://examplePublicKey@o0.ingest.sentry.io/0
```

### 4. Add Sentry DSN to Environment Variables

#### Local Development (`.env.server`)
```bash
# Add to your .env.server file
SENTRY_DSN=your_sentry_dsn_here
```

#### Railway Production

1. Go to Railway dashboard
2. Select your project
3. Go to **Variables** tab
4. Add new variable:
   - **Key**: `SENTRY_DSN`
   - **Value**: Your Sentry DSN from step 3

### 5. Update Railway Configuration (if needed)

In your Railway deployment, ensure the environment variable is set:

```bash
railway variables set SENTRY_DSN="https://your-key@sentry.io/your-project"
```

## Features

### 🔒 Secure Error Handling
- ✅ Detailed errors logged server-side only
- ✅ Sanitized, user-friendly messages sent to clients
- ✅ No internal implementation details leaked
- ✅ Sensitive headers (authorization, cookies) filtered out

### 📊 Structured Logging
- Development: Color-coded console logs
- Production: JSON-structured logs + Sentry integration

### 🎯 Error Tracking
All errors are tracked with context:
- User ID (when available)
- Operation name
- Request details
- Stack traces

## Usage Examples

### In Your Server Code

```typescript
import { logger, handleError, ValidationError } from '../utils';

export const myOperation = async (args, context) => {
  try {
    // Your operation logic
    if (!args.email) {
      throw new ValidationError('Email is required');
    }
    
    // Success
    logger.info('Operation completed', {
      userId: context.user.id,
      operation: 'myOperation',
    });
    
    return result;
  } catch (error) {
    // Automatically logs to Sentry in production
    throw handleError(error, {
      operation: 'myOperation',
      userId: context?.user?.id,
    });
  }
};
```

### Available Custom Errors

```typescript
// Authentication
throw new AuthenticationError(); // 401
throw new UnauthorizedError(); // 403

// Resources
throw new NotFoundError('User'); // 404

// Business Logic
throw new InsufficientCreditsError(required, available); // 402
throw new ValidationError('Invalid input'); // 400

// External Services
throw new ImageGenerationError('Generation failed'); // 503
throw new PaymentProcessingError('Payment failed'); // 503

// Database
throw new DatabaseError('Query failed'); // 500

// Storage
throw new StorageError('Upload failed'); // 500

// Rate Limiting
throw new RateLimitError(); // 429
```

## Sentry Dashboard Features

Once set up, you'll have access to:

### 1. Error Tracking
- See all errors in real-time
- Group similar errors
- Track error frequency
- Set up alerts for critical errors

### 2. User Context
- See which users experienced errors
- Filter errors by user ID
- Understand user impact

### 3. Performance Monitoring
- Track operation performance
- Identify slow operations
- Monitor API response times

### 4. Releases & Deployments
- Tag errors by release version
- Track error rates per deployment
- Rollback if needed

## Environment Behavior

### Development (`NODE_ENV=development`)
```
🔴 ERROR: Image generation failed
📋 Context: { userId: '123', operation: 'generateTextToImage' }
⚠️  Error: Error { ... full stack trace ... }
```

### Production (`NODE_ENV=production`)
- No console output (except structured JSON)
- Errors sent to Sentry dashboard
- User sees: "Failed to generate image. Please try again."

## Monitoring & Alerts

### Set Up Alerts in Sentry

1. Go to **Alerts** in Sentry dashboard
2. Create new alert rule:
   - **When**: Error rate exceeds 10 errors/min
   - **Then**: Send email/Slack notification

### Useful Sentry Filters

```
# Find all errors for a specific user
user.id:abc-123

# Find all payment errors
operation:generateCheckoutSession

# Find all 500 errors
http.status_code:500
```

## Testing the Integration

### Test in Development

```typescript
import { logger } from '../server/utils/logger';

// Test logging
logger.info('Test info message');
logger.warn('Test warning');
logger.error('Test error', { test: true });
```

### Test in Production

1. Deploy to Railway with `SENTRY_DSN` set
2. Trigger an error in your app
3. Check Sentry dashboard for the error

## Troubleshooting

### Sentry Not Receiving Errors

1. **Check DSN**: Ensure `SENTRY_DSN` environment variable is set
2. **Check NODE_ENV**: Sentry only activates in production (`NODE_ENV=production`)
3. **Check Network**: Ensure server can reach `sentry.io`
4. **Check Logs**: Look for "Failed to initialize Sentry" messages

### Errors Still Showing in Console

This is normal in development. In production:
- Errors are logged as JSON (for Railway logs)
- Errors are sent to Sentry
- No readable console output

## Cost & Limits

### Sentry Free Tier
- ✅ 5,000 errors/month
- ✅ 10,000 transactions/month
- ✅ 1 team member
- ✅ 30-day data retention

Perfect for small to medium projects!

## Best Practices

1. ✅ **Always use custom errors** instead of generic `Error`
2. ✅ **Include context** in `handleError()` calls
3. ✅ **Don't log sensitive data** (passwords, tokens, full credit cards)
4. ✅ **Review Sentry weekly** to catch trends
5. ✅ **Set up alerts** for critical errors

## Additional Resources

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Error Tracking Best Practices](https://docs.sentry.io/product/best-practices/)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

## Support

If you encounter issues:
1. Check this documentation
2. Review Sentry logs
3. Check Railway deployment logs
4. Contact support with error details

---

**Status**: ✅ Integrated and ready for deployment
**Last Updated**: 2025-10-04
