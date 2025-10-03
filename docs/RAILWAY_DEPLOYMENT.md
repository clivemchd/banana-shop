# Railway Deployment Guide for Nano Studio

This guide covers deploying your Wasp 0.17.0 application to Railway.

## Prerequisites

1. **Railway Account**: Create an account at [railway.com](https://railway.com)
2. **Railway CLI**: Install the latest version
   ```bash
   npm install -g @railway/cli
   ```
3. **Login to Railway**:
   ```bash
   railway login
   ```

## Initial Deployment

### Option 1: Using the Deploy Script (Recommended)

Run the automated deployment script:

```bash
npm run deploy:railway
```

This script will:
- Check if Railway CLI is installed and you're logged in
- Load environment variables from `.env.server`
- Deploy your app with all required secrets
- Create these services on Railway:
  - `micro-banana-client` (Frontend)
  - `micro-banana-server` (Backend)
  - `Postgres` (Database)

### Option 2: Manual Deployment

If you prefer manual control:

```bash
wasp deploy railway launch micro-banana \
  --server-secret GOOGLE_CLIENT_ID=your-google-client-id \
  --server-secret GOOGLE_CLIENT_SECRET=your-google-client-secret \
  --server-secret STRIPE_SECRET_KEY_TEST=your-stripe-key \
  # ... add all other secrets
```

## Updating Your Deployed App

After the initial deployment, use this command for updates:

```bash
npm run deploy:railway:update
```

Or manually:

```bash
wasp deploy railway deploy micro-banana
```

## Environment Variables

### Server-Side Secrets (Automatically Set)

The deployment script sets these from your `.env.server`:

- `FAL_KEY` - Fal.ai API key for image generation
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCP_BUCKET_NAME` - Google Cloud Storage bucket
- `GOOGLE_APPLICATION_CREDENTIALS` - GCP credentials path
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `STRIPE_SECRET_KEY_TEST` - Stripe secret key (test mode)
- `STRIPE_PUBLISHABLE_KEY_TEST` - Stripe publishable key (test mode)
- `STRIPE_WEBHOOK_SECRET_TEST` - Stripe webhook secret
- `STRIPE_*_PRICE_ID` - All Stripe price IDs
- `LAUNCH_30` - Launch promotion flag
- `GEMINI_API_KEY` - Gemini API key

### Auto-Configured by Wasp

These are automatically set by Wasp CLI:

- `DATABASE_URL` - PostgreSQL connection string
- `WASP_WEB_CLIENT_URL` - Frontend URL
- `WASP_SERVER_URL` - Backend API URL
- `JWT_SECRET` - Authentication secret

### Client-Side Variables (Optional)

If you want to enable traditional auth:

```bash
REACT_APP_ENABLE_TRADITIONAL_AUTH=true npm run deploy:railway
```

## Post-Deployment Configuration

After deployment, you need to update external services:

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add these to **Authorized redirect URIs**:
   ```
   https://micro-banana-server.railway.app/auth/google/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://micro-banana-client.railway.app
   ```

### 2. Stripe Webhook Configuration

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Create a new webhook endpoint:
   ```
   https://micro-banana-server.railway.app/payments-webhook
   ```
3. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Update in Railway dashboard:
   - Go to your project > `micro-banana-server` service
   - Variables tab
   - Update `STRIPE_WEBHOOK_SECRET_TEST` with the new secret

### 3. Google Cloud Storage (For Production)

Update your GCP bucket CORS configuration to allow your Railway URLs:

```bash
# Create cors.json
cat > cors.json << EOF
[
  {
    "origin": ["https://micro-banana-client.railway.app"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS config
gsutil cors set cors.json gs://your-bucket-name
```

## Custom Domain Setup

**For detailed custom domain setup instructions, see [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md)**

### Quick Reference

If you have a custom domain (e.g., `nanostudioai.com`), you can configure it:

**Current Production URLs:**
- Client: `https://nanostudioai.com` and `https://www.nanostudioai.com`
- Server: `https://api.nanostudioai.com`

**Railway Default URLs (backup):**
- Client: `https://micro-banana-client-production.up.railway.app`
- Server: `https://micro-banana-server-production.up.railway.app`

See the full custom domain setup guide for:
- Cloudflare DNS configuration
- Railway domain setup
- SSL certificate provisioning
- External service updates (Google OAuth, Stripe)
- Troubleshooting and verification

## Production Considerations

### Switch to Production Stripe Keys

When ready for production:

1. In Railway dashboard > `micro-banana-server` > Variables
2. Update or add:
   - `STRIPE_SECRET_KEY_PROD` (your production secret key)
   - `STRIPE_WEBHOOK_SECRET` (production webhook secret)
3. Update all `STRIPE_*_PRICE_ID` variables with production price IDs

### Environment Configuration

Set `NODE_ENV=production` in Railway:
1. Go to `micro-banana-server` > Variables
2. Add/update: `NODE_ENV=production`

### Google Cloud Storage

1. Create a production bucket (e.g., `banana-shop-bucket-prod`)
2. Update `GCP_BUCKET_NAME` in Railway variables
3. Ensure proper CORS and IAM permissions

## Monitoring & Logs

View logs in Railway:
1. Go to your project
2. Click on a service (`micro-banana-server` or `micro-banana-client`)
3. Go to the "Deployments" tab
4. Click on the latest deployment to view logs

## Troubleshooting

### Deployment Failed

1. Check Railway logs for errors
2. Verify all environment variables are set correctly
3. Ensure your `.env.server` file has all required values

### OAuth Not Working

1. Verify redirect URIs in Google Cloud Console match Railway URLs
2. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway

### Stripe Webhooks Failing

1. Check webhook URL in Stripe dashboard
2. Verify `STRIPE_WEBHOOK_SECRET_TEST` matches Stripe
3. Review Railway logs for webhook errors

### Database Connection Issues

1. Railway automatically sets `DATABASE_URL`
2. Check if Postgres service is running in Railway dashboard
3. Verify database migrations ran successfully

## Cost Optimization

Railway offers:
- **Starter Plan**: $5/month (500 hours of execution time)
- **Developer Plan**: $10/month (1000 hours)
- **Team Plan**: $20/month (2000 hours)

Tips:
- Use environment variables to switch between test/prod Stripe
- Monitor usage in Railway dashboard
- Scale down unused services

## Additional Resources

- [Railway Documentation](https://docs.railway.com)
- [Wasp Deployment Docs](https://wasp.sh/docs/0.17.0/deployment/deployment-methods/wasp-deploy/railway)
- [Railway + Wasp Blog Post](https://wasp.sh/blog/2025/07/15/railway-deployment)
