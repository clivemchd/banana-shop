// Helper function that only works on server-side
function requireNodeEnvVar(key: string): string {
  if (typeof process === 'undefined') {
    // Return a placeholder for client-side - actual values will be provided by server operations
    return `placeholder_${key}`;
  }
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export enum SubscriptionStatus {
  PastDue = 'past_due',
  CancelAtPeriodEnd = 'cancel_at_period_end',
  Active = 'active',
  Deleted = 'deleted',
}

export enum PaymentPlanId {
  Starter = 'starter',
  Pro = 'pro',
  Business = 'business',
  Credits = 'credits',
}

export interface PaymentPlan {
  // Returns the id under which this payment plan is identified on your payment processor.
  // E.g. this might be price id on Stripe, or variant id on LemonSqueezy.
  getPaymentProcessorPlanId: () => string;
  effect: PaymentPlanEffect;
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export type PaymentPlanEffect = 
  | { kind: 'subscription' } 
  | { kind: 'credits'; amount: number };

export const LAUNCH_COUPON_CODE = 'LAUNCH30';
export const LAUNCH_DISCOUNT_PERCENT = 30;

export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  [PaymentPlanId.Starter]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('STRIPE_STARTER_PRICE_ID'),
    effect: { kind: 'subscription' },
    name: 'Starter',
    price: 9,
    description: 'Perfect for getting started and occasional use.',
    features: [
      '40 image edits per month',
      'Standard processing speed',
      'Community support',
      'Overages: $0.20/credit'
    ],
  },
  [PaymentPlanId.Pro]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('STRIPE_PRO_PRICE_ID'),
    effect: { kind: 'subscription' },
    name: 'Pro',
    price: 19,
    description: 'For hobbyists and regular users.',
    features: [
      '180 image edits per month',
      'Faster processing',
      'Email support',
      'Overages: $0.15/credit'
    ],
    isPopular: true,
  },
  [PaymentPlanId.Business]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('STRIPE_BUSINESS_PRICE_ID'),
    effect: { kind: 'subscription' },
    name: 'Business',
    price: 89,
    description: 'For power users and small businesses.',
    features: [
      '1,000 image edits per month',
      'Highest priority processing',
      'Dedicated support',
      'Overages: $0.12/credit'
    ],
  },
  [PaymentPlanId.Credits]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('STRIPE_CREDITS_PRICE_ID'),
    effect: { kind: 'credits', amount: 50 },
    name: '50 Credits',
    price: 19,
    description: 'One-time credit purchase',
    features: [
      '50 AI generations',
      'No expiration',
      'Use anytime',
      'Perfect for testing'
    ],
  },
};

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  return paymentPlans[planId].name;
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getSubscriptionPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter((planId) => paymentPlans[planId].effect.kind === 'subscription');
}

export function getCreditPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter((planId) => paymentPlans[planId].effect.kind === 'credits');
}

export function calculateLaunchPrice(originalPrice: number): number {
  return Math.round(originalPrice * (1 - LAUNCH_DISCOUNT_PERCENT / 100));
}

export function isLaunchOfferActive(): boolean {
  // Use LAUNCH_30 environment variable as source of truth
  return process.env.LAUNCH_30 === 'true';
}