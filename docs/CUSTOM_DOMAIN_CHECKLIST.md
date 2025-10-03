# Custom Domain Migration Checklist

Quick reference checklist for migrating NanoStudio to custom domains.

## Pre-Migration Checklist

- [ ] Domain purchased and active on Cloudflare: `nanostudioai.com`
- [ ] Railway deployment is working with default URLs
- [ ] Current Google OAuth credentials are accessible
- [ ] Current Stripe webhook configuration is documented
- [ ] Backup of current environment variables taken

## Migration Steps

### 1. Cloudflare DNS Setup (5-10 min)

- [ ] Log in to Cloudflare Dashboard
- [ ] Navigate to DNS settings for `nanostudioai.com`
- [ ] Add CNAME for `@` → `micro-banana-client-production.up.railway.app` (Proxied)
- [ ] Add CNAME for `www` → `micro-banana-client-production.up.railway.app` (Proxied)
- [ ] Add CNAME for `api` → `micro-banana-server-production.up.railway.app` (Proxied)
- [ ] Verify DNS records are active

### 2. Railway Custom Domain Configuration (10-15 min)

#### Client Service
- [ ] Open Railway Dashboard → `micro-banana` project
- [ ] Select `micro-banana-client` service
- [ ] Go to Settings → Domains
- [ ] Add custom domain: `nanostudioai.com`
- [ ] Add custom domain: `www.nanostudioai.com`
- [ ] Wait for SSL certificate provisioning (✅ checkmarks)

#### Server Service
- [ ] Select `micro-banana-server` service
- [ ] Go to Settings → Domains
- [ ] Add custom domain: `api.nanostudioai.com`
- [ ] Wait for SSL certificate provisioning (✅ checkmark)

### 3. Update Railway Environment Variables (5 min)

- [ ] Go to `micro-banana-server` → Variables
- [ ] Update `WASP_WEB_CLIENT_URL=https://nanostudioai.com`
- [ ] Verify `WASP_SERVER_URL=https://api.nanostudioai.com` (auto-configured)
- [ ] Click "Deploy" to apply changes

### 4. Update Google OAuth (5 min)

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [ ] Select OAuth 2.0 Client ID
- [ ] Add Authorized JavaScript Origins:
  - [ ] `https://nanostudioai.com`
  - [ ] `https://www.nanostudioai.com`
- [ ] Add Authorized Redirect URIs:
  - [ ] `https://nanostudioai.com/auth/google/callback`
  - [ ] `https://www.nanostudioai.com/auth/google/callback`
- [ ] Keep old Railway URLs for transition period
- [ ] Save changes

### 5. Update Stripe Webhook (10 min)

Choose one option:

**Option A: Update Existing Webhook**
- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
- [ ] Click on existing webhook
- [ ] Update URL to: `https://api.nanostudioai.com/payments-webhook`
- [ ] Save changes

**Option B: Create New Webhook (Recommended)**
- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
- [ ] Create new webhook: `https://api.nanostudioai.com/payments-webhook`
- [ ] Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- [ ] Copy new webhook signing secret
- [ ] Update in Railway: `STRIPE_WEBHOOK_SECRET_PROD=whsec_...`
- [ ] Deploy changes

### 6. Update Google Cloud Storage CORS (if applicable) (5 min)

- [ ] Go to [GCS Console](https://console.cloud.google.com/storage/browser)
- [ ] Select your bucket
- [ ] Update CORS configuration to include:
  - [ ] `https://nanostudioai.com`
  - [ ] `https://www.nanostudioai.com`
- [ ] Save changes

### 7. Deploy Application (10-15 min)

- [ ] Run: `npm run deploy:railway:update`
- [ ] Monitor deployment logs in Railway
- [ ] Wait for successful deployment

### 8. Verification (15-20 min)

#### DNS & SSL
- [ ] Test DNS: `nslookup nanostudioai.com`
- [ ] Test DNS: `nslookup www.nanostudioai.com`
- [ ] Test DNS: `nslookup api.nanostudioai.com`
- [ ] Visit `https://nanostudioai.com` - Valid SSL? ✅
- [ ] Visit `https://www.nanostudioai.com` - Valid SSL? ✅
- [ ] Visit `https://api.nanostudioai.com` - Valid SSL? ✅

#### Application Functionality
- [ ] Homepage loads correctly
- [ ] Google OAuth login works
- [ ] Dashboard loads for authenticated user
- [ ] Image generation works
- [ ] Image upload works
- [ ] Stripe checkout works
- [ ] Subscription management works
- [ ] No CORS errors in browser console
- [ ] Check Railway logs for errors

#### External Services
- [ ] Google OAuth redirects correctly
- [ ] Stripe webhook receives test event
- [ ] Test Stripe webhook from Stripe Dashboard
- [ ] GCS image uploads work (if applicable)

### 9. Post-Migration (Optional)

- [ ] Update README.md with new URLs
- [ ] Update documentation references
- [ ] Set up uptime monitoring
- [ ] Configure Cloudflare SSL/TLS to "Full (strict)"
- [ ] Enable Cloudflare performance features (minification, Brotli)
- [ ] Monitor application for 24-48 hours

### 10. Cleanup (After 30 Days)

- [ ] Remove old Railway URLs from Google OAuth
- [ ] Delete old Stripe webhook endpoint (if created new one)
- [ ] Update any external documentation
- [ ] Remove backup environment variables

## Rollback Plan (If Needed)

If something goes wrong, revert:

- [ ] Railway: Change `WASP_WEB_CLIENT_URL` back to Railway URL
- [ ] Google OAuth: Ensure old Railway URLs still in redirect URIs
- [ ] Stripe: Switch back to old webhook URL
- [ ] Redeploy: `npm run deploy:railway:update`

## Time Estimates

| Phase | Estimated Time |
|-------|----------------|
| Cloudflare DNS | 5-10 min |
| Railway Setup | 10-15 min |
| Environment Variables | 5 min |
| Google OAuth | 5 min |
| Stripe Webhook | 10 min |
| GCS CORS | 5 min |
| Deployment | 10-15 min |
| Verification | 15-20 min |
| **Total** | **65-85 min** |

Add 5-10 minutes for DNS propagation wait time.

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| DNS not resolving | Wait 5-10 min, flush DNS cache |
| SSL not valid | Wait 2-5 min for Railway provisioning |
| OAuth error | Check redirect URIs in Google Console |
| Stripe webhook fails | Verify webhook URL and secret |
| CORS errors | Check `WASP_WEB_CLIENT_URL` and GCS CORS |

## Support Resources

- **Detailed Guide:** `docs/CUSTOM_DOMAIN_SETUP.md`
- **Railway Logs:** `railway logs --service micro-banana-server`
- **DNS Checker:** https://dnschecker.org/
- **SSL Test:** https://www.ssllabs.com/ssltest/

---

**Migration Date:** _______________
**Completed By:** _______________
**Issues Encountered:** _______________
