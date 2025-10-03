# How to Change Environment Variables on Railway

This guide shows you how to update environment variables for your deployed Railway application.

## Understanding Client vs Server Variables

### Server Variables (Runtime)
- Set once and persist across deployments
- Can be changed without redeploying code
- Examples: API keys, database URLs, secrets
- Loaded at runtime by the server

### Client Variables (Build-time)
- Must be set EVERY time you deploy
- Baked into the client bundle during build
- Must be prefixed with `REACT_APP_`
- Examples: `REACT_APP_ENABLE_TRADITIONAL_AUTH`

---

## Method 1: Railway Dashboard (GUI)

### Update Server Variables

1. Go to [Railway Dashboard](https://railway.com/dashboard)
2. Select project: **micro-banana**
3. Click on service: **micro-banana-server**
4. Click the **Variables** tab
5. To edit existing variable:
   - Click on the variable
   - Update the value
   - Click save
6. To add new variable:
   - Click **New Variable**
   - Enter `KEY=value`
   - Click **Add**
7. Service will auto-redeploy with new variables

### Update Client Variables

Client variables need to be set during build. You have two options:

#### Option A: Via Service Settings
1. Go to **micro-banana-client** service
2. Click **Settings** tab
3. Find **Build Command** section
4. Modify the build command to include env vars:
   ```bash
   REACT_APP_MY_VAR=value npm run build
   ```

#### Option B: Use Railway CLI (Recommended - see below)

---

## Method 2: Railway CLI (Recommended)

### Setup (One Time)

Link your project to Railway:

```bash
railway link
```

Select:
- Workspace: `Clive 👨‍💻's Projects`
- Project: `micro-banana`
- Environment: `production`

### Update Server Variables

Switch to server service:

```bash
railway service micro-banana-server
```

View current variables:

```bash
railway variables
```

Set/update a single variable:

```bash
railway variables --set "GOOGLE_CLIENT_ID=your-new-value"
```

Set multiple variables:

```bash
railway variables \
  --set "GOOGLE_CLIENT_ID=new-value" \
  --set "GOOGLE_CLIENT_SECRET=new-secret" \
  --set "FAL_KEY=new-key"
```

Delete a variable:

```bash
railway variables --unset "OLD_VARIABLE_NAME"
```

### Update Client Variables

Client variables must be set during deployment. Switch to server to redeploy the client:

```bash
railway service micro-banana-server
```

Then redeploy with the updated script (see Method 3 below).

---

## Method 3: Update via Deployment Script (Best for Complete Updates)

### For Server Variables Only

1. **Update your local `.env.server` file** with new values:

   ```bash
   # Edit .env.server
   GOOGLE_CLIENT_ID=new-value
   STRIPE_SECRET_KEY_PROD=new-value
   # etc...
   ```

2. **Redeploy** using the update command:

   ```bash
   npm run deploy:railway:update
   ```

   This only redeploys code, **it does NOT update environment variables**.

### For Server Variables (Full Update)

If you need to update environment variables during deployment:

1. **Update `.env.server`** with new values

2. **Run the full deployment script**:

   ```bash
   npm run deploy:railway
   ```

   This will:
   - Load variables from `.env.server`
   - Deploy with all server secrets
   - Update all environment variables

### For Client Variables

Client variables must be passed during deployment:

1. **Update the deploy script** or run manually:

   ```bash
   REACT_APP_ENABLE_TRADITIONAL_AUTH=true npm run deploy:railway:update
   ```

2. Or create a custom deploy script in `package.json`:

   ```json
   {
     "scripts": {
       "deploy:railway:prod": "REACT_APP_MY_VAR=value bash ./bash/deploy-railway.sh"
     }
   }
   ```

---

## Common Environment Variables to Update

### Server Variables

#### Google OAuth
```bash
railway variables \
  --set "GOOGLE_CLIENT_ID=your-id" \
  --set "GOOGLE_CLIENT_SECRET=your-secret"
```

#### Stripe (Switch to Production)
```bash
railway variables \
  --set "STRIPE_SECRET_KEY_PROD=sk_live_..." \
  --set "STRIPE_PUBLISHABLE_KEY_PROD=pk_live_..." \
  --set "STRIPE_WEBHOOK_SECRET_PROD=whsec_..."
```

#### Google Cloud Storage
```bash
railway variables \
  --set "GCP_BUCKET_NAME=banana-shop-bucket-prod" \
  --set "GCP_PROJECT_ID=your-project-id"
```

#### App Configuration
```bash
railway variables \
  --set "NODE_ENV=production" \
  --set "LAUNCH_30=false"
```

### Client Variables

These need to be set EVERY time you deploy:

```bash
REACT_APP_ENABLE_TRADITIONAL_AUTH=true npm run deploy:railway:update
```

Or in your script:

```bash
export REACT_APP_ENABLE_TRADITIONAL_AUTH=true
npm run deploy:railway:update
```

---

## Quick Reference Commands

### View all current variables
```bash
# For server
railway service micro-banana-server
railway variables

# For client  
railway service micro-banana-client
railway variables
```

### Update a single server variable
```bash
railway service micro-banana-server
railway variables --set "KEY=value"
```

### Update multiple server variables
```bash
railway service micro-banana-server
railway variables \
  --set "KEY1=value1" \
  --set "KEY2=value2" \
  --set "KEY3=value3"
```

### Skip auto-deploy when setting variables
```bash
railway variables --set "KEY=value" --skip-deploys
```

### View variables in JSON format
```bash
railway variables --json
```

### View variables in KEY=VALUE format
```bash
railway variables --kv
```

---

## Troubleshooting

### Server restarted but changes not applied
- Railway auto-deploys when you set variables
- Check logs: `railway logs`
- Manually trigger deploy in dashboard if needed

### Client variables not working
- Remember: Client variables are build-time only
- They must be set BEFORE or DURING deployment
- They won't update by just setting them in Railway dashboard
- You must redeploy the client with the env vars set

### Can't see my variables
- Make sure you're on the correct service:
  ```bash
  railway service micro-banana-server  # or micro-banana-client
  ```
- Make sure you're on the correct environment:
  ```bash
  railway environment production
  ```

### Variable not taking effect
- Check if you spelled it correctly (case-sensitive)
- Check if it's a client var (needs `REACT_APP_` prefix)
- Check server logs for errors: `railway logs`

---

## Best Practices

1. **Keep `.env.server` updated** locally with production values
2. **Use Railway CLI** for quick variable updates
3. **Use deployment script** for complete updates
4. **Never commit** `.env.server` to git (it's in `.gitignore`)
5. **Document** what each environment variable does
6. **Test locally** before updating production variables
7. **Backup** your current variables before making changes:
   ```bash
   railway variables --kv > backup-variables.txt
   ```

---

## Example: Complete Production Setup

Here's how to set up all variables for production:

```bash
# Switch to server service
railway service micro-banana-server

# Set all production variables
railway variables \
  --set "NODE_ENV=production" \
  --set "GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" \
  --set "GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET" \
  --set "STRIPE_SECRET_KEY_PROD=sk_live_YOUR_LIVE_KEY" \
  --set "STRIPE_PUBLISHABLE_KEY_PROD=pk_live_YOUR_LIVE_KEY" \
  --set "STRIPE_WEBHOOK_SECRET_PROD=whsec_YOUR_WEBHOOK_SECRET" \
  --set "GCP_BUCKET_NAME=banana-shop-bucket-prod" \
  --set "FAL_KEY=your-fal-key" \
  --set "GEMINI_API_KEY=your-gemini-key" \
  --set "LAUNCH_30=false"

# Verify
railway variables --kv
```

Then deploy client with any client-side variables:

```bash
REACT_APP_ENABLE_TRADITIONAL_AUTH=false npm run deploy:railway:update
```
