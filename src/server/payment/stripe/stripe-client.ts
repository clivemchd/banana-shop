import { Stripe } from 'stripe';
import { Environment } from '../../../server/utils/environment';

// t3dotgg best practice: Separate test and production configurations
const stripeConfig = {
  apiVersion: '2025-08-27.basil' as const,
  typescript: true as const,
};

// Use test keys in development, production keys in production
const stripeSecretKey = Environment.isDevelopment 
  ? Environment.requireVar('STRIPE_SECRET_KEY_TEST')
  : Environment.requireVar('STRIPE_SECRET_KEY_PROD');

export const stripe = new Stripe(stripeSecretKey, stripeConfig);

// Helper to get the correct webhook endpoint secret
export const getStripeWebhookSecret = () => {
  return Environment.isDevelopment
    ? Environment.requireVar('STRIPE_WEBHOOK_SECRET_TEST')
    : Environment.requireVar('STRIPE_WEBHOOK_SECRET_PROD');
};

// Helper to get publishable key for frontend
export const getStripePublishableKey = () => {
  return Environment.isDevelopment
    ? Environment.requireVar('STRIPE_PUBLISHABLE_KEY_TEST')
    : Environment.requireVar('STRIPE_PUBLISHABLE_KEY_PROD');
};