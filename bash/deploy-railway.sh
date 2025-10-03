#!/bin/bash

# Railway Deployment Script for Nano Studio
# This script deploys the application to Railway with all required environment variables

echo "🚀 Deploying Nano Studio to Railway..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway"
    echo "Login with: railway login"
    exit 1
fi

echo "✅ Railway CLI detected"
echo ""

# Load environment variables from .env.server
if [ ! -f .env.server ]; then
    echo "❌ .env.server file not found!"
    exit 1
fi

source .env.server

# Deploy with all required server secrets
echo "📦 Deploying to Railway with environment variables..."
echo ""

# Use production Stripe keys if available, otherwise fallback to test keys
STRIPE_SECRET_KEY_PROD="${STRIPE_SECRET_KEY_PROD:-$STRIPE_SECRET_KEY_TEST}"
STRIPE_PUBLISHABLE_KEY_PROD="${STRIPE_PUBLISHABLE_KEY_PROD:-$STRIPE_PUBLISHABLE_KEY_TEST}"
STRIPE_WEBHOOK_SECRET_PROD="${STRIPE_WEBHOOK_SECRET_PROD:-$STRIPE_WEBHOOK_SECRET_TEST}"

wasp deploy railway launch micro-banana \
  --server-secret FAL_KEY="$FAL_KEY" \
  --server-secret GCP_PROJECT_ID="$GCP_PROJECT_ID" \
  --server-secret GCP_BUCKET_NAME="$GCP_BUCKET_NAME" \
  --server-secret GOOGLE_APPLICATION_CREDENTIALS="$GOOGLE_APPLICATION_CREDENTIALS" \
  --server-secret GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --server-secret GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  --server-secret STRIPE_SECRET_KEY_TEST="$STRIPE_SECRET_KEY_TEST" \
  --server-secret STRIPE_PUBLISHABLE_KEY_TEST="$STRIPE_PUBLISHABLE_KEY_TEST" \
  --server-secret STRIPE_WEBHOOK_SECRET_TEST="$STRIPE_WEBHOOK_SECRET_TEST" \
  --server-secret STRIPE_SECRET_KEY_PROD="$STRIPE_SECRET_KEY_PROD" \
  --server-secret STRIPE_PUBLISHABLE_KEY_PROD="$STRIPE_PUBLISHABLE_KEY_PROD" \
  --server-secret STRIPE_WEBHOOK_SECRET_PROD="$STRIPE_WEBHOOK_SECRET_PROD" \
  --server-secret STRIPE_STARTER_MONTHLY_PRICE_ID="$STRIPE_STARTER_MONTHLY_PRICE_ID" \
  --server-secret STRIPE_PRO_MONTHLY_PRICE_ID="$STRIPE_PRO_MONTHLY_PRICE_ID" \
  --server-secret STRIPE_BUSINESS_MONTHLY_PRICE_ID="$STRIPE_BUSINESS_MONTHLY_PRICE_ID" \
  --server-secret STRIPE_STARTER_ANNUAL_PRICE_ID="$STRIPE_STARTER_ANNUAL_PRICE_ID" \
  --server-secret STRIPE_PRO_ANNUAL_PRICE_ID="$STRIPE_PRO_ANNUAL_PRICE_ID" \
  --server-secret STRIPE_BUSINESS_ANNUAL_PRICE_ID="$STRIPE_BUSINESS_ANNUAL_PRICE_ID" \
  --server-secret STRIPE_CREDITS_PRICE_ID="$STRIPE_CREDITS_PRICE_ID" \
  --server-secret LAUNCH_30="$LAUNCH_30" \
  --server-secret GEMINI_API_KEY="$GEMINI_API_KEY"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Railway dashboard to get your app URLs"
echo "2. Update your Google OAuth redirect URLs with the new Railway URLs"
echo "3. Update Stripe webhook endpoints with your Railway server URL"
echo "4. For future updates, use: npm run deploy:railway:update"
