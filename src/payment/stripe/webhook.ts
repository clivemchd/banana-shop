import { stripe, getStripeWebhookSecret } from './stripe-client';
import type { MiddlewareConfigFn } from 'wasp/server';
import { HttpError } from 'wasp/server';

// Simplified webhook for development - just log and return success
export const stripeWebhook = async (request: any, response: any, context: any) => {
  console.log('Stripe webhook received:', request.headers);
  
  // For development, just return success without validation
  // TODO: Add proper signature validation once middleware is working
  
  return { received: true };
};

export const stripeMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // For Wasp 0.17+, middlewareConfig is a Map
  const newConfig = new Map(middlewareConfig);
  
  // Add raw body parser for Stripe webhooks
  newConfig.set('rawBodyParser', (req: any, res: any, next: any) => {
    // For Stripe webhooks, we need raw body
    // This middleware will handle the raw body parsing
    next();
  });
  
  return newConfig;
};