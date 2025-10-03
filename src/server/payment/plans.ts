// Helper function that only works on server-side
function requireNodeEnvVar(key: string): string {
  if (typeof process === 'undefined') {
    // Return a placeholder for client-side - actual values will be provided by server operations
    return `placeholder_${key}`;
  }
  const value = process.env[key];
  
  // Development mode: provide mock price IDs if not set or placeholder
  if (!value || value.includes('price_...') || value.includes('placeholder_')) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Using mock price ID for ${key}. Set up real Stripe products for production.`);
      // Return mock price IDs for development testing
      const mockPriceIds: Record<string, string> = {
        'STRIPE_STARTER_MONTHLY_PRICE_ID': 'price_mock_starter_9_monthly',
        'STRIPE_STARTER_ANNUAL_PRICE_ID': 'price_mock_starter_86_annual',
        'STRIPE_PRO_MONTHLY_PRICE_ID': 'price_mock_pro_19_monthly',
        'STRIPE_PRO_ANNUAL_PRICE_ID': 'price_mock_pro_182_annual',
        'STRIPE_BUSINESS_MONTHLY_PRICE_ID': 'price_mock_business_89_monthly',
        'STRIPE_BUSINESS_ANNUAL_PRICE_ID': 'price_mock_business_854_annual',
        'STRIPE_CREDITS_PRICE_ID': 'price_mock_credits_19_onetime',
      };
      return mockPriceIds[key] || `mock_${key}`;
    }
    throw new Error(`Required environment variable ${key} is not set or is a placeholder. Please set up real Stripe price IDs.`);
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
  getPaymentProcessorPlanId: (billingCycle?: 'monthly' | 'annual') => string;
  effect: PaymentPlanEffect;
  name: string;
  price: number;
  annualPrice?: number; // Annual price for subscriptions
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
    getPaymentProcessorPlanId: (billingCycle: 'monthly' | 'annual' = 'monthly') => {
      return billingCycle === 'annual' 
        ? requireNodeEnvVar('STRIPE_STARTER_ANNUAL_PRICE_ID')
        : requireNodeEnvVar('STRIPE_STARTER_MONTHLY_PRICE_ID');
    },
    effect: { kind: 'subscription' },
    name: 'Starter',
    price: 9,
    annualPrice: 86,
    description: 'Perfect for getting started and occasional use.',
    features: [
      '80 image generations',
      '40 image edits per month',
      'Standard processing speed'
    ],
  },
  [PaymentPlanId.Pro]: {
    getPaymentProcessorPlanId: (billingCycle: 'monthly' | 'annual' = 'monthly') => {
      return billingCycle === 'annual' 
        ? requireNodeEnvVar('STRIPE_PRO_ANNUAL_PRICE_ID')
        : requireNodeEnvVar('STRIPE_PRO_MONTHLY_PRICE_ID');
    },
    effect: { kind: 'subscription' },
    name: 'Pro',
    price: 19,
    annualPrice: 182,
    description: 'For hobbyists and regular users.',
    features: [
      '360 image generations per month',
      '180 image edits per month',
      'Faster processing'
    ],
    isPopular: true,
  },
  [PaymentPlanId.Business]: {
    getPaymentProcessorPlanId: (billingCycle: 'monthly' | 'annual' = 'monthly') => {
      return billingCycle === 'annual' 
        ? requireNodeEnvVar('STRIPE_BUSINESS_ANNUAL_PRICE_ID')
        : requireNodeEnvVar('STRIPE_BUSINESS_MONTHLY_PRICE_ID');
    },
    effect: { kind: 'subscription' },
    name: 'Business',
    price: 89,
    annualPrice: 854,
    description: 'For power users and small businesses.',
    features: [
      '2,000 image generations',
      '1,000 image edits per month',
      'Highest priority processing',
      'Dedicated support'
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
  // This function should only be used server-side
  // For client-side, use the getLaunchSettings query instead
  if (typeof process === 'undefined') {
    console.warn('⚠️ isLaunchOfferActive() called on client-side. Use getLaunchSettings query instead.');
    return false; // Safe default for client
  }
  return process.env.LAUNCH_30 === 'true';
}