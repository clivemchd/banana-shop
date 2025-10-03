# Custom Domain Setup Guide for NanoStudio

This guide walks you through setting up custom domains for your NanoStudio application deployed on Railway with DNS managed by Cloudflare.

## Domain Mapping

| Service | Railway Default | Custom Domain |
|---------|----------------|---------------|
| Client (Frontend) | `micro-banana-client-production.up.railway.app` | `nanostudioai.com` and `www.nanostudioai.com` |
| Server (Backend) | `micro-banana-server-production.up.railway.app` | `api.nanostudioai.com` |

## Prerequisites

- ✅ Domain purchased on Cloudflare: `nanostudioai.com`
- ✅ Railway project deployed and running
- ✅ Access to Cloudflare DNS settings
- ✅ Access to Railway dashboard
- ✅ Access to Google Cloud Console (for OAuth)
- ✅ Access to Stripe Dashboard (for webhooks)

---

## Step 1: Configure Cloudflare DNS

### 1.1 Log in to Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain: `nanostudioai.com`
3. Navigate to **DNS** → **Records**

### 1.2 Add DNS Records for Client (Frontend)

**Record 1: Root Domain**
```
Type: CNAME
Name: @
Target: micro-banana-client-production.up.railway.app
Proxy status: ✅ Proxied (orange cloud icon)
TTL: Auto
```

**Record 2: WWW Subdomain**
```
Type: CNAME
Name: www
Target: micro-banana-client-production.up.railway.app
Proxy status: ✅ Proxied (orange cloud icon)
TTL: Auto
```

### 1.3 Add DNS Record for Server (Backend)

**Record 3: API Subdomain**
```
Type: CNAME
Name: api
Target: micro-banana-server-production.up.railway.app
Proxy status: ✅ Proxied (orange cloud icon)
TTL: Auto
```

### 1.4 Verify DNS Configuration

After adding the records, your DNS settings should look like this:

| Type | Name | Target | Proxy | TTL |
|------|------|--------|-------|-----|
| CNAME | @ | micro-banana-client-production.up.railway.app | ✅ Proxied | Auto |
| CNAME | www | micro-banana-client-production.up.railway.app | ✅ Proxied | Auto |
| CNAME | api | micro-banana-server-production.up.railway.app | ✅ Proxied | Auto |

⏱️ **Note:** DNS propagation typically takes 5-10 minutes with Cloudflare, but can take up to 24-48 hours globally.

---

## Step 2: Configure Custom Domains in Railway

### 2.1 Add Domains to Client Service

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project: `micro-banana`
3. Click on the **`micro-banana-client`** service
4. Navigate to **Settings** → **Domains**
5. Click **"+ Add Custom Domain"**
6. Enter: `nanostudioai.com`
7. Click **"Add Domain"**
8. Click **"+ Add Custom Domain"** again
9. Enter: `www.nanostudioai.com`
10. Click **"Add Domain"**

### 2.2 Add Domain to Server Service

1. In the same Railway project, click on **`micro-banana-server`** service
2. Navigate to **Settings** → **Domains**
3. Click **"+ Add Custom Domain"**
4. Enter: `api.nanostudioai.com`
5. Click **"Add Domain"**

### 2.3 Wait for SSL Certificate Provisioning

Railway will automatically provision SSL certificates for your custom domains. This typically takes 2-5 minutes.

You'll see a ✅ green checkmark next to each domain when ready.

---

## Step 3: Update Railway Environment Variables

### 3.1 Update Server Environment Variables

1. In Railway dashboard, click on **`micro-banana-server`** service
2. Navigate to **Variables** tab
3. Update the following variable:

```bash
WASP_WEB_CLIENT_URL=https://nanostudioai.com
```

4. Click **"Deploy"** to apply changes

### 3.2 Verify Other Environment Variables

Ensure these are correctly set (Railway should auto-configure these):

```bash
WASP_SERVER_URL=https://api.nanostudioai.com
DATABASE_URL=<your-postgres-connection-string>
```

---

## Step 4: Update External Service Configurations

### 4.1 Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID**

**Add Authorized JavaScript Origins:**
```
https://nanostudioai.com
https://www.nanostudioai.com
```

**Add Authorized Redirect URIs:**
```
https://nanostudioai.com/auth/google/callback
https://www.nanostudioai.com/auth/google/callback
```

**Recommended:** Keep the old Railway URLs during transition:
```
https://micro-banana-client-production.up.railway.app
https://micro-banana-client-production.up.railway.app/auth/google/callback
```

5. Click **"Save"**

### 4.2 Update Stripe Webhook Endpoint

**Option A: Update Existing Webhook**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click on your existing webhook
3. Click **"..."** menu → **"Update details"**
4. Change endpoint URL from:
   ```
   https://micro-banana-server-production.up.railway.app/payments-webhook
   ```
   To:
   ```
   https://api.nanostudioai.com/payments-webhook
   ```
5. Click **"Update endpoint"**

**Option B: Create New Webhook (Safer)**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Endpoint URL: `https://api.nanostudioai.com/payments-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the new **Signing Secret** (starts with `whsec_`)
7. Update in Railway:
   - Go to `micro-banana-server` → **Variables**
   - Update: `STRIPE_WEBHOOK_SECRET_PROD=whsec_NEW_SECRET`
   - Click **"Deploy"**

### 4.3 Update Google Cloud Storage CORS (if applicable)

If you're using Google Cloud Storage for images, update CORS configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/storage/browser)
2. Select your bucket
3. Go to **Permissions** → **CORS**
4. Update the CORS configuration to include new domains:

```json
[
  {
    "origin": [
      "https://nanostudioai.com",
      "https://www.nanostudioai.com",
      "http://localhost:3000"
    ],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

---

## Step 5: Redeploy Application

After all configurations are updated, redeploy your application to ensure all changes take effect:

```bash
npm run deploy:railway:update
```

Or manually:

```bash
wasp deploy railway deploy micro-banana
```

---

## Step 6: Verification Checklist

### ✅ DNS Verification

Test DNS resolution:

```bash
# Check root domain
nslookup nanostudioai.com

# Check www subdomain
nslookup www.nanostudioai.com

# Check API subdomain
nslookup api.nanostudioai.com
```

All should resolve to Cloudflare proxy IPs (starting with 104.x or 172.x).

### ✅ SSL Certificate Verification

Visit these URLs in your browser:

- ✅ `https://nanostudioai.com` - Should show your app with valid SSL
- ✅ `https://www.nanostudioai.com` - Should show your app with valid SSL
- ✅ `https://api.nanostudioai.com` - Should show API response with valid SSL

### ✅ Application Functionality

Test critical features:

- ✅ Homepage loads correctly
- ✅ Google OAuth login works
- ✅ Image generation/upload works
- ✅ Stripe checkout works
- ✅ Subscription management works
- ✅ No CORS errors in browser console

### ✅ External Services

- ✅ Google OAuth redirects correctly
- ✅ Stripe webhook receives events
- ✅ GCS image uploads work

---

## Troubleshooting

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN" Error

**Cause:** DNS records not propagated yet.

**Solution:**
1. Wait 5-10 minutes for Cloudflare DNS propagation
2. Flush your local DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### Issue: SSL Certificate Not Valid

**Cause:** Railway hasn't provisioned SSL yet.

**Solution:**
1. Check Railway dashboard - look for ✅ next to domain
2. Wait 2-5 minutes if still provisioning
3. If stuck, remove domain and re-add it

### Issue: OAuth Error "redirect_uri_mismatch"

**Cause:** Google OAuth redirect URIs not updated.

**Solution:**
1. Double-check Google Cloud Console OAuth settings
2. Ensure exact URLs are added (including `/auth/google/callback`)
3. Make sure to save changes in Google Console

### Issue: Stripe Webhook Not Receiving Events

**Cause:** Webhook URL not updated in Stripe.

**Solution:**
1. Check Stripe Dashboard → Webhooks
2. Verify endpoint URL is `https://api.nanostudioai.com/payments-webhook`
3. Test webhook by sending a test event
4. Check Railway logs for incoming webhook requests

### Issue: CORS Errors

**Cause:** Server not configured to accept requests from new domain.

**Solution:**
1. Verify `WASP_WEB_CLIENT_URL=https://nanostudioai.com` in Railway
2. Check GCS CORS configuration includes new domain
3. Redeploy application

### Issue: Images Not Loading

**Cause:** GCS bucket not configured for new domain.

**Solution:**
1. Update GCS CORS configuration (see Step 4.3)
2. Ensure bucket is publicly accessible for image URLs

---

## Rollback Plan

If you need to revert to Railway URLs:

### 1. In Railway Dashboard

**Server Service:**
```bash
WASP_WEB_CLIENT_URL=https://micro-banana-client-production.up.railway.app
```

### 2. In Google Cloud Console

Keep/restore old redirect URIs:
```
https://micro-banana-client-production.up.railway.app/auth/google/callback
```

### 3. In Stripe Dashboard

Restore old webhook URL:
```
https://micro-banana-server-production.up.railway.app/payments-webhook
```

### 4. Redeploy

```bash
npm run deploy:railway:update
```

---

## Post-Setup Recommendations

### 1. Monitor Application

Check Railway logs for the first 24 hours:
```bash
# Via Railway CLI
railway logs --service micro-banana-server
railway logs --service micro-banana-client
```

### 2. Update Documentation

Update any internal docs, READMEs, or wiki pages with new URLs.

### 3. Set Up Monitoring

Consider setting up uptime monitoring:
- [UptimeRobot](https://uptimerobot.com/)
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

### 4. Configure Cloudflare Settings

Optimize Cloudflare settings:
- **SSL/TLS:** Set to "Full (strict)"
- **Auto Minify:** Enable for HTML, CSS, JS
- **Brotli Compression:** Enable
- **Firewall Rules:** Set up as needed

### 5. Remove Old URLs (After Verification)

After 30 days of successful operation:
- Remove old Railway URLs from Google OAuth
- Delete old Stripe webhook endpoint
- Update any external links or documentation

---

## Quick Reference

### Production URLs

```bash
# Client (Frontend)
https://nanostudioai.com
https://www.nanostudioai.com

# Server (Backend)
https://api.nanostudioai.com

# Database
<Managed by Railway>
```

### Environment Variables (Production)

**Server (`micro-banana-server`):**
```bash
WASP_WEB_CLIENT_URL=https://nanostudioai.com
WASP_SERVER_URL=https://api.nanostudioai.com
DATABASE_URL=<auto-configured>
```

### External Service URLs

**Google OAuth Redirect:**
```
https://nanostudioai.com/auth/google/callback
```

**Stripe Webhook:**
```
https://api.nanostudioai.com/payments-webhook
```

---

## Support

If you encounter issues:

1. Check Railway deployment logs
2. Verify DNS propagation: https://dnschecker.org/
3. Test SSL: https://www.ssllabs.com/ssltest/
4. Check Cloudflare status: https://www.cloudflarestatus.com/

---

**Last Updated:** October 3, 2025
