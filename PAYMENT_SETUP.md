# NanoStudio Payment Integration Setup

This document explains how to set up the Stripe payment integration for NanoStudio.

## 🚀 Features

- **Multiple Payment Plans**: Starter ($9), Pro ($29), Business ($99), and Credits ($19)
- **Launch Offer**: 30% off first 3 months for subscriptions using coupon `LAUNCH30`
- **Stripe Integration**: Following t3dotgg best practices with test/production separation
- **Customer Portal**: Self-service subscription management
- **Webhook Processing**: Real-time payment status updates
- **Credit System**: One-time credit purchases alongside subscriptions

## 📋 Prerequisites

1. **Stripe Account**: Create an account at [stripe.com](https://stripe.com)
2. **PostgreSQL Database**: Running locally or hosted
3. **Node.js**: Version 16+ installed

## 🛠️ Setup Instructions

### 1. Stripe Configuration

1. **Create Products in Stripe Dashboard**:
   - Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
   - Create 4 products with the following details:

   **Starter Plan**
   - Name: "Starter"
   - Price: $9.00 USD/month (recurring)
   - Copy the Price ID to use as `STRIPE_STARTER_PRICE_ID`

   **Pro Plan**
   - Name: "Pro" 
   - Price: $29.00 USD/month (recurring)
   - Copy the Price ID to use as `STRIPE_PRO_PRICE_ID`

   **Business Plan**
   - Name: "Business"
   - Price: $99.00 USD/month (recurring)
   - Copy the Price ID to use as `STRIPE_BUSINESS_PRICE_ID`

   **Credits**
   - Name: "50 Credits"
   - Price: $19.00 USD (one-time)
   - Copy the Price ID to use as `STRIPE_CREDITS_PRICE_ID`

2. **Create Launch Coupon**:
   - Go to [Stripe Dashboard > Coupons](https://dashboard.stripe.com/coupons)
   - Create coupon with ID: `LAUNCH30`
   - Discount: 30% off
   - Duration: First 3 months
   - Valid for: Recurring payments only

3. **Get API Keys**:
   - Go to [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
   - Copy your Publishable and Secret keys (use test keys for development)

4. **Set up Webhook**:
   - Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `http://localhost:3001/payments-webhook` (for development)
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

### 2. Environment Configuration

1. **Copy environment files**:
   ```bash
   cp .env.server.example .env.server
   cp .env.client.example .env.client
   ```

2. **Update `.env.server`** with your Stripe keys:
   ```env
   DATABASE_URL="your_postgresql_url"
   WASP_WEB_CLIENT_URL="http://localhost:3000"
   
   # Stripe Test Keys
   STRIPE_SECRET_KEY_TEST="sk_test_your_secret_key"
   STRIPE_PUBLISHABLE_KEY_TEST="pk_test_your_publishable_key" 
   STRIPE_WEBHOOK_SECRET_TEST="whsec_your_webhook_secret"
   
   # Stripe Price IDs
   STRIPE_STARTER_PRICE_ID="price_your_starter_price_id"
   STRIPE_PRO_PRICE_ID="price_your_pro_price_id"
   STRIPE_BUSINESS_PRICE_ID="price_your_business_price_id"
   STRIPE_CREDITS_PRICE_ID="price_your_credits_price_id"
   ```

3. **Update `.env.client`**:
   ```env
   REACT_APP_STRIPE_PUBLISHABLE_KEY_TEST="pk_test_your_publishable_key"
   ```

### 3. Install Dependencies

```bash
# Install Stripe dependency
npm install stripe

# Install additional UI dependencies if needed
npm install @radix-ui/react-alert-dialog lucide-react
```

### 4. Database Migration

Run the database migration to ensure your schema is up to date:

```bash
wasp db migrate-dev
```

### 5. Start the Application

```bash
wasp start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Pricing page: http://localhost:3000/pricing

## 🧪 Testing

### Test Credit Cards

Use Stripe's test cards for development:
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000002500003155`

### Testing Flow

1. Go to `/pricing`
2. Select a plan and click subscribe
3. Use test credit card
4. Verify webhook receives events
5. Check user subscription status in database

## 🚀 Deployment

### Production Setup

1. **Update environment variables** for production:
   ```env
   STRIPE_SECRET_KEY_LIVE="sk_live_..."
   STRIPE_PUBLISHABLE_KEY_LIVE="pk_live_..."
   STRIPE_WEBHOOK_SECRET_LIVE="whsec_..."
   ```

2. **Update webhook endpoint** in Stripe Dashboard:
   ```
   https://yourdomain.com/payments-webhook
   ```

3. **Create production products** and update price IDs

### Security Checklist

- ✅ Never commit `.env.server` or `.env.client` files
- ✅ Use environment-specific Stripe keys
- ✅ Validate webhook signatures
- ✅ Use HTTPS in production
- ✅ Implement proper error handling

## 📚 File Structure

```
src/payment/
├── plans.ts                    # Payment plans and pricing
├── operations.ts               # Wasp server operations
├── payment-processor.ts        # Payment processor interface
├── pricing-page.tsx           # Pricing page component
├── checkout-page.tsx          # Checkout success/cancel page
└── stripe/
    ├── stripe-client.ts       # Stripe client configuration
    ├── checkout-utils.ts      # Checkout session utilities
    ├── payment-processor.ts   # Stripe-specific implementation
    └── webhook.ts             # Webhook event handlers
```

## 🎯 Next Steps

1. **Customize pricing plans** in `src/payment/plans.ts`
2. **Style the pricing page** to match your brand
3. **Add usage tracking** for credit-based features
4. **Implement billing notifications**
5. **Add subscription analytics**

## 🆘 Troubleshooting

### Common Issues

**Webhook not receiving events**:
- Check webhook URL is correct
- Verify webhook secret matches
- Check server logs for errors

**Payment not completing**:
- Verify price IDs are correct
- Check Stripe dashboard for errors
- Ensure webhook events are selected

**Environment issues**:
- Verify all environment variables are set
- Check for typos in price IDs
- Ensure database is running

## 📞 Support

For issues with this implementation, check:
1. Wasp documentation: https://wasp.sh/docs
2. Stripe documentation: https://stripe.com/docs
3. t3dotgg Stripe guide: https://github.com/t3dotgg/stripe-recommendations