# 🚀 Quick Reference: Error Handling & Logging

## Import What You Need

```typescript
import { 
  logger,
  handleError,
  AuthenticationError,
  UnauthorizedError,
  NotFoundError,
  InsufficientCreditsError,
  ValidationError,
  ImageGenerationError,
  PaymentProcessingError,
  DatabaseError,
  StorageError,
  ConfigurationError,
  RateLimitError
} from '../utils';
```

## Common Patterns

### 1. Basic Error Handling
```typescript
export const myOperation = async (args, context) => {
  try {
    // Your logic here
    return result;
  } catch (error) {
    throw handleError(error, {
      operation: 'myOperation',
      userId: context?.user?.id,
    });
  }
};
```

### 2. Authentication Check
```typescript
if (!context.user) {
  throw new AuthenticationError();
}
```

### 3. Not Found
```typescript
const user = await context.entities.Users.findUnique({ where: { id } });
if (!user) {
  throw new NotFoundError('User');
}
```

### 4. Validation
```typescript
if (!email || !email.includes('@')) {
  throw new ValidationError('Valid email required');
}
```

### 5. Insufficient Credits
```typescript
if (credits < required) {
  throw new InsufficientCreditsError(required, credits);
}
```

### 6. Logging
```typescript
// Info
logger.info('User signed up', { userId: user.id });

// Warning
logger.warn('API rate limit approaching', { userId });

// Error
logger.error('Payment failed', { userId, amount }, error);

// Debug (dev only)
logger.debug('Processing request', { data });
```

## Error Status Codes

| Error Type | Status Code | Use Case |
|-----------|-------------|----------|
| `AuthenticationError` | 401 | User not logged in |
| `UnauthorizedError` | 403 | No permission |
| `NotFoundError` | 404 | Resource not found |
| `InsufficientCreditsError` | 402 | Not enough credits |
| `ValidationError` | 400 | Invalid input |
| `ImageGenerationError` | 503 | AI service error |
| `PaymentProcessingError` | 503 | Payment service error |
| `DatabaseError` | 500 | DB query failed |
| `StorageError` | 500 | File storage error |
| `ConfigurationError` | 500 | Missing env var |
| `RateLimitError` | 429 | Too many requests |

## Environment Setup

### Local (.env.server)
```bash
SENTRY_DSN=https://your-key@sentry.io/project-id
NODE_ENV=development
```

### Production (Railway)
```bash
SENTRY_DSN=https://your-key@sentry.io/project-id
NODE_ENV=production
```

## What Users See vs What's Logged

### User Sees
```
Failed to generate image. Please try again.
```

### Server Logs (Sentry)
```json
{
  "error": "API rate limit exceeded",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "operation": "generateTextToImage",
  "prompt": "A beautiful sunset over the ocean...",
  "stack": "at generateTextToImageCore (fal-test.ts:45)..."
}
```

## Testing

### Development
```bash
# Start dev server
npm run dev

# Trigger an error
# Check console for colored logs
```

### Production
```bash
# Deploy to Railway
npm run deploy:railway:update

# Trigger an error
# Check Sentry dashboard
```

## Sentry Setup (5 min)

1. Go to https://sentry.io
2. Create account & Node.js project
3. Copy DSN
4. Add to `.env.server` and Railway
5. Done! ✅

## Quick Checklist

- [ ] Sentry installed (`@sentry/node`)
- [ ] SENTRY_DSN in `.env.server`
- [ ] SENTRY_DSN in Railway
- [ ] All console.error removed
- [ ] All operations use handleError
- [ ] Documentation reviewed
- [ ] Tested locally
- [ ] Tested in production

---

**Need Help?**
- Full Setup: `/docs/SENTRY_SETUP_GUIDE.md`
- Implementation: `/docs/ERROR_HANDLING_IMPLEMENTATION.md`
- Completion Status: `/docs/IMPLEMENTATION_COMPLETE.md`
