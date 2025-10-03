# Custom Domain Setup - Quick Start Guide

**Goal:** Migrate NanoStudio from Railway default URLs to custom domain `nanostudioai.com`

**Time Required:** ~70-85 minutes  
**Difficulty:** Intermediate  
**Prerequisites:** Cloudflare account, Railway access, domain purchased

---

## 🚀 Quick Start (For the Impatient)

### Step 1: Cloudflare DNS (5 min)

Log in to Cloudflare → Your domain → DNS → Add records:

```
CNAME | @ | micro-banana-client-production.up.railway.app | Proxied ✅
CNAME | www | micro-banana-client-production.up.railway.app | Proxied ✅
CNAME | api | micro-banana-server-production.up.railway.app | Proxied ✅
```

### Step 2: Railway Custom Domains (10 min)

**Railway Dashboard → micro-banana project:**

**Client service:** Add domains:
- `nanostudioai.com`
- `www.nanostudioai.com`

**Server service:** Add domain:
- `api.nanostudioai.com`

Wait for ✅ SSL certificates.

### Step 3: Update Railway Environment (2 min)

**Server service → Variables:**
```
WASP_WEB_CLIENT_URL=https://nanostudioai.com
```

Click "Deploy"

### Step 4: Update Google OAuth (5 min)

**Google Cloud Console → Credentials → OAuth 2.0 Client:**

Add to **JavaScript origins:**
```
https://nanostudioai.com
https://www.nanostudioai.com
```

Add to **Redirect URIs:**
```
https://nanostudioai.com/auth/google/callback
https://www.nanostudioai.com/auth/google/callback
```

### Step 5: Update Stripe Webhook (5 min)

**Stripe Dashboard → Webhooks:**

Create new endpoint:
```
https://api.nanostudioai.com/payments-webhook
```

Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

Copy signing secret → Railway Server Variables:
```
STRIPE_WEBHOOK_SECRET_PROD=whsec_...
```

### Step 6: Deploy & Test (15 min)

```bash
npm run deploy:railway:update
```

**Test:**
- ✅ `https://nanostudioai.com` loads
- ✅ Google login works
- ✅ Stripe checkout works

---

## 📚 Detailed Guides

**For comprehensive instructions:** See [`CUSTOM_DOMAIN_SETUP.md`](./CUSTOM_DOMAIN_SETUP.md)

**For step-by-step checklist:** See [`CUSTOM_DOMAIN_CHECKLIST.md`](./CUSTOM_DOMAIN_CHECKLIST.md)

**For technical details:** See [`CUSTOM_DOMAIN_SUMMARY.md`](./CUSTOM_DOMAIN_SUMMARY.md)

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Domain not loading | Wait 5-10 min for DNS, flush local cache |
| SSL error | Wait 2-5 min for Railway SSL provisioning |
| OAuth fails | Check Google Console redirect URIs |
| Stripe webhook fails | Verify webhook URL and secret match |
| CORS errors | Check `WASP_WEB_CLIENT_URL` in Railway |

---

## 🔄 Rollback (If Needed)

**Railway Server Variables:**
```
WASP_WEB_CLIENT_URL=https://micro-banana-client-production.up.railway.app
```

Redeploy:
```bash
npm run deploy:railway:update
```

---

## ✅ Success Criteria

- [ ] `https://nanostudioai.com` shows homepage with valid SSL
- [ ] Google login works on custom domain
- [ ] Image generation works
- [ ] Stripe checkout works
- [ ] No CORS errors in browser console

---

## 📞 Need Help?

- **Full setup guide:** `docs/CUSTOM_DOMAIN_SETUP.md`
- **DNS checker:** https://dnschecker.org/
- **SSL tester:** https://www.ssllabs.com/ssltest/
- **Railway logs:** `railway logs --service micro-banana-server`

---

**Ready to start?** Follow the steps above or use the [detailed checklist](./CUSTOM_DOMAIN_CHECKLIST.md) for a guided experience.
