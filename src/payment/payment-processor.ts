import type { PaymentPlan } from './plans';
import type { PrismaClient } from '@prisma/client';

export interface CreateCheckoutSessionArgs {
  userId: string;
  userEmail: string;
  paymentPlan: PaymentPlan;
  prismaUserDelegate: PrismaClient['users'];
}

export interface FetchCustomerPortalUrlArgs { 
  userId: string; 
  prismaUserDelegate: PrismaClient['users']; 
}

export interface PaymentProcessor {
  id: 'stripe' | 'lemonsqueezy';
  createCheckoutSession: (args: CreateCheckoutSessionArgs) => Promise<{ session: { id: string; url: string }; }>; 
  fetchCustomerPortalUrl: (args: FetchCustomerPortalUrlArgs) => Promise<string | null>;
  webhook: any; // Will be properly typed when we integrate with Wasp
  webhookMiddlewareConfigFn: any; // Will be properly typed when we integrate with Wasp
}

/**
 * Choose which payment processor you'd like to use.
 * For this implementation, we're using Stripe following t3dotgg best practices.
 */
import { stripePaymentProcessor } from './stripe/payment-processor';

export const paymentProcessor: PaymentProcessor = stripePaymentProcessor;