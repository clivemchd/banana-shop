# Understanding Environment Variables in Wasp

This document explains how environment variables work in your Wasp application and the difference between server-side and client-side variables.

## 🏗️ Architecture Overview

Your Wasp app has **three** separate parts:
1. **Server** (Node.js backend) - runs on Railway at `micro-banana-server-production.up.railway.app`
2. **Client** (React frontend) - runs on Railway at `micro-banana-client-production.up.railway.app`
3. **Database** (PostgreSQL) - runs on Railway's internal network

## 🔐 Server-Side Environment Variables

### Location
- **Local Development**: `.env.server` (never commit this!)
- **Production (Railway)**: Set in Railway dashboard or CLI

### Characteristics
- **Runtime variables**: Loaded when server starts
- Can contain secrets (API keys, database passwords, etc.)
- Never exposed to the browser
- Can be updated without rebuilding code

### Important Wasp Variables (Auto-configured by Railway deployment)

```bash
# Automatically set by Wasp CLI during Railway deployment
DATABASE_URL=postgresql://...                    # Database connection
WASP_WEB_CLIENT_URL=https://micro-banana-client-production.up.railway.app
WASP_SERVER_URL=https://micro-banana-server-production.up.railway.app
JWT_SECRET=auto-generated-secret
```

### Your Custom Server Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (Production)
STRIPE_SECRET_KEY_PROD=sk_live_...
STRIPE_PUBLISHABLE_KEY_PROD=pk_live_...
STRIPE_WEBHOOK_SECRET_PROD=whsec_...

# Stripe (Test)
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...

# Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
# etc...

# External Services
FAL_KEY=your-fal-ai-key
GEMINI_API_KEY=your-gemini-key
GCP_PROJECT_ID=banana-shop-470810
GCP_BUCKET_NAME=banana-shop-bucket-prod
GOOGLE_APPLICATION_CREDENTIALS=path-to-credentials

# App Config
NODE_ENV=production
LAUNCH_30=true
```

### How to Update Server Variables

**Method 1: Railway CLI**
```bash
railway service micro-banana-server
railway variables --set "GOOGLE_CLIENT_ID=new-value"
```

**Method 2: Railway Dashboard**
1. Go to project → `micro-banana-server` → Variables tab
2. Edit or add variables
3. Auto-deploys when saved

**Method 3: Redeploy with script**
```bash
# Update .env.server locally, then:
npm run deploy:railway
```

---

## 🌐 Client-Side Environment Variables

### Location
- **Local Development**: `.env.client` (optional, not currently used)
- **Production (Railway)**: Set during deployment (build-time)

### Characteristics
- **Build-time variables**: Baked into the bundle during compilation
- Must be prefixed with `REACT_APP_`
- Available in browser (never put secrets here!)
- Cannot contain server secrets
- Must be set **every time** you deploy

### Why Build-Time?

When Vite builds your React app, it replaces `import.meta.env.REACT_APP_*` with the actual values:

```typescript
// In your code
const apiUrl = import.meta.env.REACT_APP_API_URL;

// After build (becomes literal string in bundle.js)
const apiUrl = "https://micro-banana-server-production.up.railway.app";
```

This means:
- ✅ Faster runtime (no variable lookup)
- ✅ Smaller bundle (tree-shaking works better)
- ❌ Can't change without rebuilding
- ❌ Values are visible in browser (never use secrets!)

### Your Current Client Variables

```bash
# Optional - only if you need to override defaults
REACT_APP_API_URL=https://micro-banana-server-production.up.railway.app
REACT_APP_ENABLE_TRADITIONAL_AUTH=false
REACT_APP_APP_NAME=NanoStudio
REACT_APP_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...  # Safe for client!
```

### How to Set Client Variables

**During deployment:**
```bash
REACT_APP_ENABLE_TRADITIONAL_AUTH=true npm run deploy:railway:update
```

**Or create a deploy script in `package.json`:**
```json
{
  "scripts": {
    "deploy:railway:prod": "REACT_APP_API_URL=https://api.myapp.com npm run deploy:railway:update"
  }
}
```

---

## 🔄 How Wasp Handles URLs Automatically

### Server → Client Communication

Wasp automatically configures the client to talk to the server. You don't need to manually set API URLs!

**On Railway:**
```bash
# Server knows where client is
WASP_WEB_CLIENT_URL=https://micro-banana-client-production.up.railway.app

# Client knows where server is (configured by Wasp during build)
# This is injected automatically - you don't set it manually!
```

**The client code in your app automatically uses the correct server URL:**
```typescript
// You just import and use queries/actions - Wasp handles the URLs
import { generateTextToImage } from 'wasp/client/operations';

// Wasp automatically sends this to the correct server URL
const result = await generateTextToImage({ prompt: "..." });
```

### Your Manual Config

In `src/client/utils/environment.ts`, you have:

```typescript
export const config = {
  apiUrl: Environment.isDevelopment 
    ? 'http://localhost:3001'
    : (Environment.getClientVar('API_URL') || 'https://micro-banana-server-production.up.railway.app'),
};
```

This is **only needed if** you're making custom API calls outside of Wasp's query/action system. For 99% of your app, Wasp handles this automatically.

---

## 📋 Environment Variables Checklist

### ✅ Server Variables (Set Once in Railway)

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `STRIPE_SECRET_KEY_PROD`
- [ ] `STRIPE_PUBLISHABLE_KEY_PROD`
- [ ] `STRIPE_WEBHOOK_SECRET_PROD`
- [ ] All `STRIPE_*_PRICE_ID` variables
- [ ] `FAL_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `GCP_PROJECT_ID`
- [ ] `GCP_BUCKET_NAME`
- [ ] `NODE_ENV=production`

### ✅ Auto-Configured by Wasp (Don't manually set)

- [ ] `DATABASE_URL` ← Railway sets this
- [ ] `WASP_WEB_CLIENT_URL` ← Wasp deployment sets this
- [ ] `WASP_SERVER_URL` ← Wasp deployment sets this
- [ ] `JWT_SECRET` ← Wasp deployment sets this

### ✅ Client Variables (Set During Each Deploy)

- [ ] `REACT_APP_ENABLE_TRADITIONAL_AUTH` (if you want traditional auth)
- [ ] `REACT_APP_API_URL` (only if overriding default)
- [ ] Any custom feature flags you add

---

## 🎯 Best Practices

### DO ✅

1. **Keep `.env.server` in `.gitignore`** - It contains secrets!
2. **Use `.env.server.example`** - Document what variables are needed
3. **Use Railway CLI** - Fastest way to update server variables
4. **Use Wasp's built-in URL handling** - Don't manually configure API URLs unless needed
5. **Prefix client vars with `REACT_APP_`** - Required by Vite
6. **Update `.env.server` locally** - Keep it in sync with Railway
7. **Test locally first** - Before updating production variables

### DON'T ❌

1. **Don't commit `.env.server`** - Contains secrets!
2. **Don't put secrets in client variables** - They're visible in browser!
3. **Don't expect client vars to update without redeployment** - They're build-time
4. **Don't manually set `DATABASE_URL`, `WASP_SERVER_URL`, etc.** - Wasp handles these
5. **Don't use `process.env` in client code** - Use `import.meta.env` instead
6. **Don't forget to set client vars during each deploy** - They won't persist

---

## 🔍 Debugging Environment Variables

### Check Server Variables

```bash
railway service micro-banana-server
railway variables --kv
```

### Check Client Variables

Client variables are baked into the bundle. To verify:

1. Open browser dev tools
2. Go to Sources tab
3. Search for `import.meta.env` or your variable name
4. You'll see the literal value in the bundled code

### Common Issues

**Issue: "Required environment variable X is not set"**
- **Server**: Variable not set in Railway → Go to Railway dashboard or use CLI
- **Client**: Variable not set during build → Redeploy with the variable set

**Issue: "Client variable not working"**
- Did you prefix it with `REACT_APP_`?
- Did you set it during deployment (not after)?
- Did you redeploy after setting it?

**Issue: "Variable updated in Railway but not working"**
- **Server**: Should auto-redeploy. Check logs with `railway logs`
- **Client**: You must redeploy the client with the new variable

---

## 📚 Related Documentation

- **Railway Variables**: `/docs/RAILWAY_UPDATE_ENV_VARS.md`
- **Railway Deployment**: `/docs/RAILWAY_DEPLOYMENT.md`
- **Quick Fix Guide**: `/docs/RAILWAY_QUICK_FIX.md`
- **Wasp Env Docs**: https://wasp.sh/docs/0.17.0/project/env-vars
