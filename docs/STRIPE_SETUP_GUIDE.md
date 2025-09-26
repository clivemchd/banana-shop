# Stripe Payment Integration Setup Guide

## 🚀 Complete Implementation Summary

Your pricing system is now fully functional with:
- ✅ **Proper webhook signature validation** following Stripe documentation
- ✅ **Functional pricing page** - users can click "Get Started" to purchase
- ✅ **LAUNCH30 coupon system** controlled by `LAUNCH_30=true` environment variable
- ✅ **Consistent pricing** between landing page and payment system
- ✅ **Test and Production ready** webhook handling

## 📋 Step-by-Step Setup Instructions

### 1. 🔑 Stripe Dashboard Setup

#### Create Products and Prices
1. **Login to Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to Products**: https://dashboard.stripe.com/products
3. **Create 3 products matching your pricing**:

   **Starter Plan**
   - Name: "Starter Plan"
   - Description: "Perfect for getting started and occasional use"
   - Price: $9.00 USD/month
   - Copy the **Price ID** (starts with `price_...`)

   **Pro Plan** 
   - Name: "Pro Plan"
   - Description: "For hobbyists and regular users"
   - Price: $19.00 USD/month
   - Copy the **Price ID** (starts with `price_...`)

   **Business Plan**
   - Name: "Business Plan"
   - Description: "For power users and small businesses"
   - Price: $89.00 USD/month
   - Copy the **Price ID** (starts with `price_...`)

   **Credits Pack** (Optional)
   - Name: "50 Credits Pack"
   - Description: "One-time credit purchase"
   - Price: $19.00 USD (one-time)
   - Copy the **Price ID** (starts with `price_...`)

#### Create LAUNCH30 Coupon
1. **Go to Coupons**: https://dashboard.stripe.com/coupons
2. **Create New Coupon**:
   - ID: `LAUNCH30`
   - Type: Percentage
   - Percent Off: 30%
   - Duration: Repeating
   - Duration in months: 3
   - Valid for: All products (or specific to your subscription products)

### 2. 🌐 Webhook Setup

#### For Development (Testing)
1. **Install Stripe CLI**: https://docs.stripe.com/stripe-cli#install
2. **Login to Stripe**: `stripe login`
3. **Start webhook forwarding**:
   ```bash
   stripe listen --forward-to localhost:3001/payments-webhook
   ```
4. **Copy the webhook secret** from CLI output (starts with `whsec_...`)
5. **Update your `.env.server`**:
   ```bash
   STRIPE_WEBHOOK_SECRET_TEST=whsec_your_webhook_secret_from_cli
   ```

#### For Production
1. **Go to Webhooks**: https://dashboard.stripe.com/webhooks
2. **Add Endpoint**:
   - Endpoint URL: `https://yourdomain.com/payments-webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. **Copy the Signing Secret** from webhook details
4. **Update production environment variables**:
   ```bash
   STRIPE_WEBHOOK_SECRET_PROD=whsec_your_production_webhook_secret
   ```

### 3. 📝 Environment Variables Setup

Update your `.env.server` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY_TEST=sk_test_your_test_secret_key
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_test_publishable_key
STRIPE_WEBHOOK_SECRET_TEST=whsec_your_test_webhook_secret

# Production keys (add when deploying)
STRIPE_SECRET_KEY_PROD=sk_live_your_production_secret_key
STRIPE_PUBLISHABLE_KEY_PROD=pk_live_your_production_publishable_key
STRIPE_WEBHOOK_SECRET_PROD=whsec_your_production_webhook_secret

# Product Price IDs (from step 1)
STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
STRIPE_BUSINESS_PRICE_ID=price_your_business_price_id
STRIPE_CREDITS_PRICE_ID=price_your_credits_price_id

# Launch Offer Control
LAUNCH_30=true  # Set to false to disable launch offer

# Environment
NODE_ENV=development  # Change to production when deploying
```

### 4. 🧪 Testing Your Implementation

#### Test Checkout Flow
1. **Start your development server**: `npm run dev`
2. **Open your app**: http://localhost:3000
3. **Navigate to pricing section**
4. **Create a test account** or login
5. **Click "Get Started"** on any plan
6. **Use Stripe test cards**:
   - Success: `4242424242424242`
   - Decline: `4000000000000002`
   - 3D Secure: `4000002500003155`

#### Test Webhook Events
1. **In another terminal, trigger test events**:
   ```bash
   # Test subscription created
   stripe trigger customer.subscription.created

   # Test payment succeeded
   stripe trigger invoice.payment_succeeded

   # Test payment failed
   stripe trigger invoice.payment_failed
   ```

2. **Check your server logs** for webhook processing messages

#### Test Launch Offer
1. **Ensure `LAUNCH_30=true`** in `.env.server`
2. **Verify 30% discount** is shown in pricing
3. **Disable with `LAUNCH_30=false`** and restart server
4. **Verify normal pricing** is restored

### 5. 🚀 Production Deployment

#### Database Schema
Ensure your Users table has these fields:
```sql
-- Add to your schema.prisma if not already present
model Users {
  // ... existing fields
  stripeCustomerId String?
  subscriptionId   String?
  subscriptionStatus String?
  // ... other fields
}
```

#### Environment Setup
1. **Set production environment variables**
2. **Update `NODE_ENV=production`**
3. **Use production Stripe keys**
4. **Set up production webhook endpoint**

#### Launch Checklist
- [ ] All environment variables configured
- [ ] Stripe products created in live mode
- [ ] LAUNCH30 coupon created in live mode
- [ ] Production webhook endpoint configured
- [ ] Database schema updated
- [ ] SSL certificate configured
- [ ] Domain configured correctly

### 6. 🎛️ Using the Pricing System

#### How Users Purchase Subscriptions
1. **User visits pricing page** (landing page or `/subscription`)
2. **Clicks "Get Started"** button
3. **If not logged in**: Redirected to signup/login
4. **If logged in**: Redirected to Stripe Checkout
5. **Completes payment**: Stripe handles payment processing
6. **Webhook processes**: Updates user subscription status
7. **User redirected back**: To success page or dashboard

#### Customer Management
- **Customer Portal**: Users can manage subscriptions via `/subscription` (payment page)
- **Subscription Updates**: Handled automatically via webhooks
- **Payment Failures**: Automatic retry logic via Stripe
- **Cancellations**: Handled via webhooks

#### Launch Offer Control
```bash
# Enable launch offer (30% off first 3 months)
LAUNCH_30=true

# Disable launch offer (normal pricing)
LAUNCH_30=false
```

### 7. 🔍 Monitoring & Debugging

#### Webhook Logs
Check your server logs for webhook processing:
```
✅ Webhook signature verified. Event type: customer.subscription.created
✅ User subscription status updated to active
✅ Successfully processed webhook: customer.subscription.created
```

#### Error Handling
- **Invalid signatures**: Check webhook secret configuration
- **Failed payments**: Check payment method and customer setup
- **Database errors**: Verify user exists and schema is correct

#### Stripe Dashboard Monitoring
- **Payments**: https://dashboard.stripe.com/payments
- **Subscriptions**: https://dashboard.stripe.com/subscription
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Logs**: https://dashboard.stripe.com/logs

## 🎯 Key Features Implemented

### ✅ Complete Webhook Implementation
- **Signature verification** following Stripe best practices
- **Event handling** for all subscription lifecycle events
- **Database updates** for user subscription status
- **Error handling** with proper HTTP responses
- **Logging** for debugging and monitoring

### ✅ Functional Pricing Page
- **Real checkout integration** with Stripe
- **User authentication** flow
- **Loading states** and error handling
- **Launch offer** conditional display
- **Responsive design** with professional styling

### ✅ Environment-Controlled Launch Offer
- **Single source of truth** via `LAUNCH_30` env variable
- **Frontend and backend sync** for consistent behavior
- **Easy enable/disable** without code changes
- **Automatic pricing calculations** with proper rounding

This implementation is production-ready and follows Stripe's recommended best practices for security and reliability! 🚀