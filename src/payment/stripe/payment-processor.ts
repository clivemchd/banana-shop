import type { PaymentPlanEffect } from '../plans';
import { paymentPlans } from '../plans';
import type { CreateCheckoutSessionArgs, FetchCustomerPortalUrlArgs, PaymentProcessor } from '../payment-processor.js';
import { fetchStripeCustomer, createStripeCheckoutSession, getStripeCustomerPortalUrl } from './checkout-utils';
import { stripeWebhook, stripeMiddlewareConfigFn } from './webhook';

export type StripeMode = 'subscription' | 'payment';

export const stripePaymentProcessor: PaymentProcessor = {
  id: 'stripe',
  createCheckoutSession: async ({ userId, userEmail, paymentPlan, billingCycle = 'monthly', prismaUserDelegate }: CreateCheckoutSessionArgs) => {
    const customer = await fetchStripeCustomer(userEmail);
    const stripeSession = await createStripeCheckoutSession({
      priceId: paymentPlan.getPaymentProcessorPlanId(billingCycle),
      customerId: customer.id,
      mode: paymentPlanEffectToStripeMode(paymentPlan.effect),
      metadata: {
        userId,
        planId: Object.keys(paymentPlans).find(
          key => paymentPlans[key as keyof typeof paymentPlans] === paymentPlan
        ) || 'unknown',
      },
    });
    
    // Update user with Stripe customer ID
    await prismaUserDelegate.update({
      where: { id: userId },
      data: { paymentProcessorUserId: customer.id },
    });

    if (!stripeSession.url) {
      throw new Error('Error creating Stripe Checkout Session');
    }

    const session = {
      url: stripeSession.url,
      id: stripeSession.id,
    };
    
    return { session };
  },
  
  fetchCustomerPortalUrl: async ({ userId, prismaUserDelegate }: FetchCustomerPortalUrlArgs) => {
    const user = await prismaUserDelegate.findUnique({
      where: { id: userId },
    });

    if (!user?.paymentProcessorUserId) {
      return null;
    }

    return getStripeCustomerPortalUrl(user.paymentProcessorUserId);
  },
  
  webhook: stripeWebhook,
  webhookMiddlewareConfigFn: stripeMiddlewareConfigFn,
};

function paymentPlanEffectToStripeMode(planEffect: PaymentPlanEffect): StripeMode {
  const effectToMode: Record<PaymentPlanEffect['kind'], StripeMode> = {
    subscription: 'subscription',
    credits: 'payment',
  };
  return effectToMode[planEffect.kind];
}