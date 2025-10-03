# Google Authentication Implementation Guide

This document explains how Google OAuth authentication is implemented in the application and how it handles different environments.

## Architecture Overview

### Authentication Flow

1. **User clicks "Continue with Google"** on any auth page
2. **Client calls `initiateGoogleSignIn()`** from `auth-helpers.ts`
3. **Helper function redirects to** `${apiUrl}/auth/google/login`
4. **Server handles OAuth flow** (managed by Wasp)
5. **Google authenticates user** and redirects back
6. **User is logged in** and redirected to dashboard

## File Structure

```
src/client/
├── utils/
│   ├── auth-helpers.ts          # ✨ Common auth functions (NEW)
│   └── environment.ts            # Environment config
└── pages/
    └── auth/
        ├── google-sign-in.tsx    # Google-only sign-in page
        ├── sign-in.tsx           # Sign-in with Google option
        └── sign-up.tsx           # Sign-up with Google option
```

## Common Authentication Helpers

### Location: `src/client/utils/auth-helpers.ts`

```typescript
/**
 * Initiates Google OAuth sign-in flow
 * Uses the proper API URL from environment configuration
 */
export const initiateGoogleSignIn = (): void => {
  const apiUrl = config.apiUrl;
  const googleAuthUrl = `${apiUrl}/auth/google/login`;
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
```

### Benefits

✅ **Single source of truth** - One function for all Google sign-in  
✅ **Environment-aware** - Automatically uses correct API URL  
✅ **Easy to maintain** - Update in one place, works everywhere  
✅ **Type-safe** - TypeScript ensures correct usage  
✅ **Testable** - Can be easily mocked for tests

## Environment Configuration

### How API URL is Determined

The `config.apiUrl` in `src/client/utils/environment.ts` follows this priority:

```typescript
export const config = {
  apiUrl: Environment.isDevelopment 
    ? 'http://localhost:3001'
    : (Environment.getClientVar('API_URL') || 'https://micro-banana-server-production.up.railway.app'),
};
```

**Priority Order:**
1. **Development**: Always uses `http://localhost:3001`
2. **Production**: 
   - First tries `REACT_APP_API_URL` (if set during deployment)
   - Falls back to Railway URL: `https://micro-banana-server-production.up.railway.app`

### Setting API URL for Different Environments

#### Local Development
No configuration needed! It automatically uses `http://localhost:3001`.

#### Production (Railway)
The fallback URL works automatically, but you can override it:

```bash
# Option 1: Set during deployment
REACT_APP_API_URL=https://your-custom-domain.com npm run deploy:railway:update

# Option 2: Use default Railway URL (no action needed)
# It will use: https://micro-banana-server-production.up.railway.app
```

#### Custom Domain
If you add a custom domain to Railway:

```bash
# Update the API URL during deployment
REACT_APP_API_URL=https://api.nanostudio.com npm run deploy:railway:update
```

## Usage in Components

### Import the Helper

```typescript
import { initiateGoogleSignIn } from '../../utils/auth-helpers';
```

### Use in Button onClick

```typescript
<Button onClick={initiateGoogleSignIn}>
  Continue with Google
</Button>
```

### Get URL for Link Component

```typescript
import { getGoogleAuthUrl } from '../../utils/auth-helpers';

// In component
const googleUrl = getGoogleAuthUrl();

<a href={googleUrl}>Sign in with Google</a>
```

## Updated Auth Pages

All auth pages now use the common helper:

### 1. Google Sign-In Page (`google-sign-in.tsx`)
```typescript
import { initiateGoogleSignIn } from '../../utils/auth-helpers';

const handleGoogleSignIn = () => {
  initiateGoogleSignIn();
};
```

### 2. Sign-In Page (`sign-in.tsx`)
```typescript
import { initiateGoogleSignIn } from '../../utils/auth-helpers';

<Button onClick={initiateGoogleSignIn}>
  Continue with Google
</Button>
```

### 3. Sign-Up Page (`sign-up.tsx`)
```typescript
import { initiateGoogleSignIn } from '../../utils/auth-helpers';

<Button onClick={initiateGoogleSignIn}>
  Continue with Google
</Button>
```

## Testing

### Test Locally

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to any auth page**:
   - `/signin` - Sign in page
   - `/signup` - Sign up page

3. **Click "Continue with Google"**

4. **Verify redirect URL**:
   - Should redirect to: `http://localhost:3001/auth/google/login`
   - Google OAuth will handle the rest

### Test on Railway

1. **Deploy to Railway**:
   ```bash
   npm run deploy:railway:update
   ```

2. **Open your Railway app**:
   - `https://micro-banana-client-production.up.railway.app`

3. **Click "Continue with Google"**

4. **Verify redirect URL**:
   - Should redirect to: `https://micro-banana-server-production.up.railway.app/auth/google/login`
   - Or your custom domain if set

## Troubleshooting

### Issue: Google OAuth Not Working in Production

**Symptoms**: 
- Redirect works but Google shows error
- "Redirect URI mismatch" error

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add your Railway URLs to **Authorized redirect URIs**:
   ```
   https://micro-banana-server-production.up.railway.app/auth/google/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://micro-banana-client-production.up.railway.app
   ```

### Issue: Wrong API URL Used

**Symptoms**:
- Console shows redirect to wrong URL
- 404 error on auth endpoint

**Solution**:
1. Check `import.meta.env.MODE` in browser console
2. Verify `REACT_APP_API_URL` is set during deployment
3. Check fallback URL in `environment.ts` is correct

**Debug in Browser Console**:
```javascript
// Check current mode
console.log(import.meta.env.MODE); // 'development' or 'production'

// Check if API URL is set
console.log(import.meta.env.REACT_APP_API_URL);
```

### Issue: Hardcoded localhost:3001 in Production

**This should no longer happen!** ✅

If you see this:
1. Verify you've pulled the latest code
2. Check that `auth-helpers.ts` exists
3. Verify auth pages import `initiateGoogleSignIn`
4. Rebuild and redeploy

## Migration Checklist

If updating from old implementation:

- [x] Create `src/client/utils/auth-helpers.ts`
- [x] Update `google-sign-in.tsx` to use helper
- [x] Update `sign-in.tsx` to use helper
- [x] Update `sign-up.tsx` to use helper
- [x] Update `.env.client` with proper comments
- [x] Update `environment.ts` with Railway fallback URL
- [x] Test locally
- [x] Deploy to Railway
- [x] Test on Railway
- [x] Update Google OAuth redirect URIs

## Best Practices

### DO ✅

1. **Always use `initiateGoogleSignIn()`** for Google OAuth
2. **Test in both environments** (local and production)
3. **Use environment variables** for configuration
4. **Keep auth logic centralized** in helper functions
5. **Update Google Cloud Console** when URLs change

### DON'T ❌

1. **Don't hardcode URLs** in components
2. **Don't use different implementations** across pages
3. **Don't forget to update** Google OAuth redirect URIs
4. **Don't skip testing** after deployment
5. **Don't mix localhost ports** with production domains

## Future Enhancements

Potential improvements for the auth system:

1. **Add error handling** to `initiateGoogleSignIn()`
2. **Add loading state** during OAuth redirect
3. **Add success/error callbacks** for custom handling
4. **Support other OAuth providers** (GitHub, Microsoft, etc.)
5. **Add auth state persistence** across page reloads
6. **Implement remember me** functionality

## Related Documentation

- **Environment Variables**: `/docs/ENVIRONMENT_VARIABLES_EXPLAINED.md`
- **Railway Deployment**: `/docs/RAILWAY_DEPLOYMENT.md`
- **Google OAuth Setup**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Wasp Auth Docs**: https://wasp.sh/docs/0.17.0/auth/overview
