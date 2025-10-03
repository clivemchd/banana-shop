# Custom Domain Setup - Summary of Changes

This document summarizes all changes made to support custom domain migration from Railway default URLs to `nanostudioai.com`.

## Migration Overview

**From (Railway Default):**
- Client: `micro-banana-client-production.up.railway.app`
- Server: `micro-banana-server-production.up.railway.app`

**To (Custom Domain):**
- Client: `nanostudioai.com` and `www.nanostudioai.com`
- Server: `api.nanostudioai.com`

## Code Changes

### 1. Client Environment Configuration

**File:** `src/client/utils/environment.ts`

**Change:**
```typescript
// OLD
apiUrl: Environment.isDevelopment 
  ? 'http://localhost:3001'
  : (Environment.getClientVar('API_URL') || 'https://micro-banana-server-production.up.railway.app'),

// NEW
apiUrl: Environment.isDevelopment 
  ? 'http://localhost:3001'
  : (Environment.getClientVar('API_URL') || 'https://api.nanostudioai.com'),
```

**Impact:** Production API calls now default to custom domain.

### 2. Server Environment Variables Example

**File:** `.env.server.example`

**Change:**
```bash
# OLD
WASP_WEB_CLIENT_URL="http://localhost:3000"

# NEW
# Wasp Web Client URL (used for redirect URLs)
# Development: http://localhost:3000
# Production: https://nanostudioai.com
WASP_WEB_CLIENT_URL="http://localhost:3000"
```

**Impact:** Better documentation for production setup.

### 3. Client Environment Variables Example

**File:** `.env.client.example`

**Change:**
```bash
# OLD
# REACT_APP_API_URL="https://micro-banana-server-production.up.railway.app"

# NEW
# Optional: Override production API URL if needed (defaults to Railway deployment)
# Development: http://localhost:3001
# Production: https://api.nanostudioai.com
# REACT_APP_API_URL="https://api.nanostudioai.com"
```

**Impact:** Better documentation for custom domain setup.

## Documentation Added

### 1. Custom Domain Setup Guide

**File:** `docs/CUSTOM_DOMAIN_SETUP.md` (NEW)

Comprehensive guide covering:
- Cloudflare DNS configuration
- Railway custom domain setup
- SSL certificate provisioning
- Environment variable updates
- Google OAuth configuration
- Stripe webhook updates
- GCS CORS configuration
- Verification checklist
- Troubleshooting guide
- Rollback procedures

### 2. Migration Checklist

**File:** `docs/CUSTOM_DOMAIN_CHECKLIST.md` (NEW)

Quick reference checklist with:
- Pre-migration tasks
- Step-by-step migration process
- Time estimates (65-85 minutes total)
- Common issues and quick fixes
- Rollback plan

### 3. Railway Deployment Guide Update

**File:** `docs/RAILWAY_DEPLOYMENT.md`

**Updated Section:** Custom Domain Setup

Changed from detailed inline instructions to a reference to the dedicated guide:
```markdown
## Custom Domain Setup

**For detailed custom domain setup instructions, see [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md)**

### Quick Reference

Current Production URLs:
- Client: https://nanostudioai.com and https://www.nanostudioai.com
- Server: https://api.nanostudioai.com
```

### 4. Railway Quick Fix Update

**File:** `docs/RAILWAY_QUICK_FIX.md`

**Updated:** Stripe webhook URL example to use custom domain:
```markdown
- URL: https://api.nanostudioai.com/payments-webhook (or Railway URL if not using custom domain)
```

## Environment Variables to Update in Railway

### Required Updates

**Service:** `micro-banana-server`

| Variable | Current Value | New Value |
|----------|---------------|-----------|
| `WASP_WEB_CLIENT_URL` | `https://micro-banana-client-production.up.railway.app` | `https://nanostudioai.com` |

**Note:** `WASP_SERVER_URL` is auto-configured by Railway when custom domain is added.

## External Service Configuration Changes

### 1. Google OAuth (Google Cloud Console)

**Add to Authorized JavaScript Origins:**
- `https://nanostudioai.com`
- `https://www.nanostudioai.com`

**Add to Authorized Redirect URIs:**
- `https://nanostudioai.com/auth/google/callback`
- `https://www.nanostudioai.com/auth/google/callback`

**Keep during transition:**
- Old Railway URLs for fallback

### 2. Stripe Webhook

**Update endpoint URL from:**
```
https://micro-banana-server-production.up.railway.app/payments-webhook
```

**To:**
```
https://api.nanostudioai.com/payments-webhook
```

**Or:** Create new webhook endpoint and update `STRIPE_WEBHOOK_SECRET_PROD`

### 3. Google Cloud Storage CORS (if applicable)

**Add to allowed origins:**
```json
{
  "origin": [
    "https://nanostudioai.com",
    "https://www.nanostudioai.com",
    "http://localhost:3000"
  ]
}
```

## DNS Configuration (Cloudflare)

### Required DNS Records

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | @ | micro-banana-client-production.up.railway.app | ✅ Proxied |
| CNAME | www | micro-banana-client-production.up.railway.app | ✅ Proxied |
| CNAME | api | micro-banana-server-production.up.railway.app | ✅ Proxied |

## Railway Custom Domain Configuration

### Client Service (`micro-banana-client`)

**Add custom domains:**
1. `nanostudioai.com`
2. `www.nanostudioai.com`

### Server Service (`micro-banana-server`)

**Add custom domain:**
1. `api.nanostudioai.com`

## No Changes Required

These files/configurations remain unchanged:
- `main.wasp` - No hardcoded URLs
- Database configuration - Managed by Railway
- Stripe price IDs - Domain-independent
- Image generation logic - Uses environment variables
- Authentication flow - Uses environment variables

## Testing Checklist

After migration, verify:

### ✅ DNS & SSL
- [ ] `https://nanostudioai.com` - Valid SSL
- [ ] `https://www.nanostudioai.com` - Valid SSL
- [ ] `https://api.nanostudioai.com` - Valid SSL

### ✅ Application Functionality
- [ ] Homepage loads
- [ ] Google OAuth login
- [ ] Dashboard access
- [ ] Image generation
- [ ] Image upload
- [ ] Stripe checkout
- [ ] Subscription management
- [ ] No CORS errors

### ✅ External Services
- [ ] Google OAuth redirects correctly
- [ ] Stripe webhook receives events
- [ ] GCS operations work

## Rollback Procedure

If issues arise, revert in this order:

1. **Railway Environment Variables:**
   ```bash
   WASP_WEB_CLIENT_URL=https://micro-banana-client-production.up.railway.app
   ```

2. **Google OAuth:** Ensure old Railway URLs are still in redirect URIs

3. **Stripe:** Revert webhook URL to Railway default

4. **Redeploy:**
   ```bash
   npm run deploy:railway:update
   ```

## Timeline & Effort

| Phase | Duration |
|-------|----------|
| **Planning & Documentation** | ✅ Complete |
| **Cloudflare DNS Setup** | 5-10 minutes |
| **Railway Configuration** | 10-15 minutes |
| **Environment Updates** | 5 minutes |
| **External Services** | 20 minutes |
| **Deployment** | 10-15 minutes |
| **Verification** | 15-20 minutes |
| **DNS Propagation** | 5-10 minutes |
| **Total** | ~70-85 minutes |

## Post-Migration Tasks

1. **Immediate (Within 24 hours):**
   - [ ] Monitor Railway logs
   - [ ] Test all critical features
   - [ ] Check error rates

2. **Short-term (Within 1 week):**
   - [ ] Set up uptime monitoring
   - [ ] Configure Cloudflare optimizations
   - [ ] Update internal documentation

3. **Long-term (After 30 days):**
   - [ ] Remove old Railway URLs from OAuth
   - [ ] Delete old Stripe webhook
   - [ ] Clean up backup configurations

## Support & Resources

**Documentation:**
- Full Guide: `docs/CUSTOM_DOMAIN_SETUP.md`
- Checklist: `docs/CUSTOM_DOMAIN_CHECKLIST.md`
- Railway Guide: `docs/RAILWAY_DEPLOYMENT.md`

**External Tools:**
- DNS Checker: https://dnschecker.org/
- SSL Test: https://www.ssllabs.com/ssltest/
- Railway Docs: https://docs.railway.com

**Railway Commands:**
```bash
# View logs
railway logs --service micro-banana-server
railway logs --service micro-banana-client

# Check variables
railway variables
```

---

**Prepared:** October 3, 2025  
**Status:** Ready for implementation  
**Estimated Time:** 70-85 minutes  
**Risk Level:** Low (full rollback available)
