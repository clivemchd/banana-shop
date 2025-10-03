# NanoStudio – AI-Powered Image Generation Platform

NanoStudio is an AI-powered image generation platform built with Wasp, offering subscription-based access to advanced image creation tools.

## Prerequisites

- **Node.js** (newest LTS version recommended): We recommend install Node through a Node version manager, e.g. `nvm`.
- **Wasp** (latest version): Install via
  ```sh
  curl -sSL https://get.wasp.sh/installer.sh | sh
  ```

## Production URLs

- **Website:** https://nanostudioai.com
- **API:** https://api.nanostudioai.com

## Features

- 🎨 AI-powered image generation (Fal.ai & Google Gemini)
- 💳 Stripe subscription management
- 🔐 Google OAuth authentication
- ☁️ Google Cloud Storage integration
- 📊 Credit-based usage system
- 🎯 Multiple subscription tiers

## Development

### Quick Start

```bash
# Start development server
npm run dev

# Run database migrations
npm run dev:dbm

# View database
npm run db:preview
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Wasp + Vite) |
| `npm run build` | Build for production |
| `npm run deploy:railway` | Deploy to Railway |
| `npm run deploy:railway:update` | Update existing Railway deployment |
| `npm run dev:dbm` | Run database migrations |
| `npm run db:preview` | Open Prisma Studio |
| `npm run dev:stripe` | Listen to Stripe webhooks locally |
| `npm test:client` | Run client tests |

### Environment Setup

1. Copy environment examples:
   ```bash
   cp .env.server.example .env.server
   cp .env.client.example .env.client
   ```

2. Fill in required values:
   - Google OAuth credentials
   - Stripe API keys
   - Fal.ai API key
   - Gemini API key
   - GCP credentials

3. Start the database:
   ```bash
   npm run db:start
   ```

4. Run migrations:
   ```bash
   npm run dev:dbm
   ```

5. Start development:
   ```bash
   npm run dev
   ```

## Deployment

### Railway Deployment

For detailed deployment instructions, see:
- **Quick Start:** [`docs/RAILWAY_DEPLOYMENT.md`](./docs/RAILWAY_DEPLOYMENT.md)
- **Custom Domain Setup:** [`docs/CUSTOM_DOMAIN_SETUP.md`](./docs/CUSTOM_DOMAIN_SETUP.md)
- **Domain Migration Checklist:** [`docs/CUSTOM_DOMAIN_CHECKLIST.md`](./docs/CUSTOM_DOMAIN_CHECKLIST.md)

### Quick Deploy

```bash
# Initial deployment
npm run deploy:railway

# Updates
npm run deploy:railway:update
```

## Documentation

### Setup & Deployment
- [`RAILWAY_DEPLOYMENT.md`](./docs/RAILWAY_DEPLOYMENT.md) - Railway deployment guide
- [`CUSTOM_DOMAIN_SETUP.md`](./docs/CUSTOM_DOMAIN_SETUP.md) - Custom domain configuration
- [`CUSTOM_DOMAIN_QUICKSTART.md`](./docs/CUSTOM_DOMAIN_QUICKSTART.md) - Quick domain setup guide
- [`CUSTOM_DOMAIN_CHECKLIST.md`](./docs/CUSTOM_DOMAIN_CHECKLIST.md) - Migration checklist

### Configuration
- [`ENVIRONMENT_VARIABLES_EXPLAINED.md`](./docs/ENVIRONMENT_VARIABLES_EXPLAINED.md) - Environment variables guide
- [`AUTHENTICATION_CONFIGURATION.md`](./docs/AUTHENTICATION_CONFIGURATION.md) - Auth setup
- [`GOOGLE_AUTH_IMPLEMENTATION.md`](./docs/GOOGLE_AUTH_IMPLEMENTATION.md) - Google OAuth setup
- [`STRIPE_SETUP_GUIDE.md`](./docs/STRIPE_SETUP_GUIDE.md) - Stripe integration

### Features
- [`IMAGE_STORAGE_IMPLEMENTATION_PLAN.md`](./docs/IMAGE_STORAGE_IMPLEMENTATION_PLAN.md) - Image storage
- [`SUBSCRIPTION_CREDITS_IMPLEMENTATION.md`](./docs/SUBSCRIPTION_CREDITS_IMPLEMENTATION.md) - Credits system
- [`PAYMENT_SETUP.md`](./docs/PAYMENT_SETUP.md) - Payment configuration

## Tech Stack

- **Framework:** [Wasp](https://wasp.sh) 0.17.1
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Prisma
- **Database:** PostgreSQL
- **Authentication:** Google OAuth
- **Payments:** Stripe
- **AI Services:** Fal.ai, Google Gemini
- **Storage:** Google Cloud Storage
- **Hosting:** Railway
- **DNS:** Cloudflare

## Learn more

To find out more about Wasp, visit out [docs](https://wasp.sh/docs).
