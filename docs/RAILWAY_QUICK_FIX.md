# Quick Fix: Railway Production Stripe Keys Error

## Problem
Your Railway deployment is failing because it's running in production mode (`NODE_ENV=production`) but missing the production Stripe environment variables:
- `STRIPE_SECRET_KEY_PROD`
- `STRIPE_PUBLISHABLE_KEY_PROD`
- `STRIPE_WEBHOOK_SECRET_PROD`

## Immediate Fix (Using Test Keys in Production)

Since you don't have production Stripe keys yet, you can use your test keys temporarily:

### Option 1: Via Railway Dashboard (Fastest)

1. Go to [Railway Dashboard](https://railway.com/dashboard)
2. Select your project: `micro-banana`
3. Click on the `micro-banana-server` service
4. Go to the **Variables** tab
5. Add these three variables:

```
STRIPE_SECRET_KEY_PROD=sk_test_YOUR_TEST_SECRET_KEY

STRIPE_PUBLISHABLE_KEY_PROD=pk_test_YOUR_TEST_PUBLISHABLE_KEY

STRIPE_WEBHOOK_SECRET_PROD=whsec_YOUR_TEST_WEBHOOK_SECRET
```

6. Click **Save** or **Deploy** to restart the server with new variables

### Option 2: Via Railway CLI

Run this command:

```bash
railway variables --set "STRIPE_SECRET_KEY_PROD=sk_test_YOUR_KEY" --set "STRIPE_PUBLISHABLE_KEY_PROD=pk_test_YOUR_KEY" --set "STRIPE_WEBHOOK_SECRET_PROD=whsec_YOUR_SECRET"
```

## Proper Solution: Get Production Stripe Keys

When you're ready for production:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch from **Test Mode** to **Live Mode** (toggle in top right)
3. Go to **Developers** > **API keys**
4. Copy your production keys:
   - Secret key (starts with `sk_live_...`)
   - Publishable key (starts with `pk_live_...`)
5. Go to **Developers** > **Webhooks**
6. Create a new webhook endpoint:
   - URL: `https://api.nanostudioai.com/payments-webhook` (or Railway URL if not using custom domain)
   - Events: Select all subscription and payment events
7. Copy the webhook signing secret (starts with `whsec_...`)

### Update Your Local `.env.server`

Add these lines to your `.env.server`:

```bash
# Stripe Production Keys
STRIPE_SECRET_KEY_PROD=sk_live_YOUR_PRODUCTION_SECRET_KEY
STRIPE_PUBLISHABLE_KEY_PROD=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET_PROD=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
```

### Redeploy with Production Keys

```bash
npm run deploy:railway:update
```

## Understanding the Issue

Your code in `src/server/payment/stripe/stripe-client.ts` uses environment-based key selection:

```typescript
const stripeSecretKey = Environment.isDevelopment 
  ? Environment.requireVar('STRIPE_SECRET_KEY_TEST')
  : Environment.requireVar('STRIPE_SECRET_KEY_PROD');
```

When `NODE_ENV=production` on Railway, it expects the `_PROD` variants of all Stripe keys.

## Alternative: Run in Development Mode on Railway (Not Recommended)

If you want to test with test keys, you could set `NODE_ENV=development` in Railway, but this is **not recommended** for a deployed app because:
- It may enable debug features
- Performance optimizations are disabled
- It's confusing to have "production" infrastructure in "development" mode

## Next Steps After Fix

1. Verify deployment is working in Railway dashboard
2. Test your app at the Railway URL
3. Plan to switch to production Stripe keys when ready for real payments
4. Update webhook endpoints in Stripe dashboard to point to Railway URLs
