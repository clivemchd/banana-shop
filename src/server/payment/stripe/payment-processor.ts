import type { PaymentPlanEffect } from '../plans';
import { paymentPlans } from '../plans';
import type { CreateCheckoutSessionArgs, FetchCustomerPortalUrlArgs, PaymentProcessor } from '../payment-processor.js';
import { fetchStripeCustomer, createStripeCheckoutSession, getStripeCustomerPortalUrl, createScheduledSubscriptionChange } from './checkout-utils';
import { stripeWebhook, stripeMiddlewareConfigFn } from './webhook';

export type StripeMode = 'subscription' | 'payment';

export const stripePaymentProcessor: PaymentProcessor = {
  id: 'stripe',
  createCheckoutSession: async ({ userId, userEmail, paymentPlan, billingCycle = 'monthly', isSubscriptionChange = false, successUrl, cancelUrl, prismaUserDelegate }: CreateCheckoutSessionArgs) => {
    const customer = await fetchStripeCustomer(userEmail);
    
    // Check if user already has an active subscription
    const user = await prismaUserDelegate.findUnique({
      where: { id: userId },
    });

    // If this is a subscription change and user already has an active subscription
    if (isSubscriptionChange && user?.subscriptionStatus === 'active' && user?.billingEndDate && paymentPlan.effect.kind === 'subscription') {
      console.log('🔄 Processing subscription change - new plan will be scheduled for next billing cycle');
      
      // Create a subscription schedule instead of immediate checkout session
      // This will start the new subscription when the current one ends
      return createScheduledSubscriptionChange({
        userId,
        userEmail,
        paymentPlan,
        billingCycle,
        currentSubscriptionEndDate: new Date(user.billingEndDate),
        prismaUserDelegate
      });
    } else if (user?.subscriptionStatus === 'active' && paymentPlan.effect.kind === 'subscription') {
      console.log('⚠️ User already has active subscription, new subscription will replace it immediately');
    }

    // Set appropriate success and cancel URLs based on context
    const defaultSuccessUrl = successUrl || (isSubscriptionChange
      ? `${process.env.WASP_WEB_CLIENT_URL}/subscriptions?success=true`
      : `${process.env.WASP_WEB_CLIENT_URL}/checkout?success=true`);
    const defaultCancelUrl = cancelUrl || `${process.env.WASP_WEB_CLIENT_URL}/subscriptions?canceled=true`

    const stripeSession = await createStripeCheckoutSession({
      priceId: paymentPlan.getPaymentProcessorPlanId(billingCycle),
      customerId: customer.id,
      mode: paymentPlanEffectToStripeMode(paymentPlan.effect),
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
      metadata: {
        userId,
        planId: Object.keys(paymentPlans).find(
          key => paymentPlans[key as keyof typeof paymentPlans] === paymentPlan
        ) || 'unknown',
        isSubscriptionChange: isSubscriptionChange ? 'true' : 'false',
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