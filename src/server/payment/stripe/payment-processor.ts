import type { PaymentPlanEffect } from '../plans';
import { paymentPlans } from '../plans';
import type { CreateCheckoutSessionArgs, FetchCustomerPortalUrlArgs, PaymentProcessor } from '../payment-processor.js';
import { fetchStripeCustomer, createStripeCheckoutSession, getStripeCustomerPortalUrl, createScheduledSubscriptionChange } from './checkout-utils';
import { stripeWebhook, stripeMiddlewareConfigFn } from './webhook';
import { stripe } from './stripe-client';
import type { Stripe } from 'stripe';

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
    if (isSubscriptionChange && user?.subscriptionStatus === 'active' && paymentPlan.effect.kind === 'subscription') {
      console.log('🔄 Processing subscription change - will modify existing subscription');
      
      // For subscription changes, modify the existing subscription instead of creating a new one
      // This prevents duplicate subscriptions and handles prorated billing correctly
      try {
        if (user.paymentProcessorUserId) {
          const subscriptions = await stripe.subscriptions.list({
            customer: user.paymentProcessorUserId,
            status: 'active',
            limit: 1,
          });
          
          if (subscriptions.data.length > 0) {
            const currentSubscription = subscriptions.data[0];
            const newPriceId = paymentPlan.getPaymentProcessorPlanId(billingCycle);
            
            console.log(`🔄 Modifying existing subscription: ${currentSubscription.id}`);
            console.log(`📋 Changing from price ${currentSubscription.items.data[0].price.id} to ${newPriceId}`);
            console.log(`🔍 Current subscription status: ${currentSubscription.status}`);
            
            // Validate that we have the necessary data
            if (!newPriceId) {
              throw new Error(`Invalid price ID for plan: ${paymentPlan.name} with billing cycle: ${billingCycle}`);
            }
            
            if (!currentSubscription.items.data[0]?.id) {
              throw new Error('Current subscription has no items to modify');
            }
            
            // Update the existing subscription with the new plan
            const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
              items: [{
                id: currentSubscription.items.data[0].id,
                price: newPriceId,
              }],
              proration_behavior: 'create_prorations', // Create prorations for the change
              billing_cycle_anchor: 'unchanged', // Keep the existing billing cycle
            });
            
            console.log('✅ Subscription modified successfully:', updatedSubscription.id);
            
            // Update user data immediately to reflect the change
            const billingCycleFromSubscription = billingCycle; // Use the requested billing cycle
            
            // Extract end date from subscription using the same approach as webhook
            let endTimestamp: number | null = null;
            const subscriptionData = updatedSubscription as unknown as Record<string, any>;
            
            if (subscriptionData.status === 'active' && subscriptionData.current_period_end) {
              endTimestamp = subscriptionData.current_period_end;
            }
            
            const endDate = endTimestamp ? new Date(endTimestamp * 1000) : new Date();
            
            // Get the payment plan ID from the updated subscription
            const updatedPlanId = Object.keys(paymentPlans).find(
              key => paymentPlans[key as keyof typeof paymentPlans] === paymentPlan
            ) || null;
            
            await prismaUserDelegate.update({
              where: { id: userId },
              data: { 
                subscriptionPlan: updatedPlanId,
                billingCycle: billingCycleFromSubscription,
                billingEndDate: endDate,
                datePaid: new Date(),
                // Clear scheduled plan fields since change is immediate
                scheduledPlanId: null,
                scheduledBillingCycle: null,
                scheduledStartDate: null,
              }
            });
            
            // Sync credits with the new subscription plan
            try {
              const { syncCreditsWithSubscription } = await import('../../credits/credits-operations');
              const creditSync = await syncCreditsWithSubscription(userId, { entities: { Users: prismaUserDelegate } });
              console.log('💳 Credits synced after subscription change:', creditSync);
            } catch (creditError) {
              console.error('❌ Failed to sync credits after subscription change:', creditError);
            }
            
            // Return success URL instead of checkout session
            return {
              session: {
                url: `${process.env.WASP_WEB_CLIENT_URL}/subscription?success=true&upgraded=true`,
                id: updatedSubscription.id,
              }
            };
          }
        }
      } catch (error: any) {
        console.error('❌ Error modifying existing subscription:', error);
        // For subscription changes, throw error instead of falling back to checkout
        throw new Error(`Failed to modify existing subscription: ${error?.message || error || 'Unknown error'}`);
      }
      
      // If we reach here, something went wrong
      throw new Error('Unable to find active subscription to modify');
    } else if (user?.subscriptionStatus === 'active' && paymentPlan.effect.kind === 'subscription') {
      console.log('⚠️ User already has active subscription, new subscription will replace it immediately');
    }

    // Set appropriate success and cancel URLs based on context
    const defaultSuccessUrl = successUrl || (isSubscriptionChange
      ? `${process.env.WASP_WEB_CLIENT_URL}/subscription?success=true`
      : `${process.env.WASP_WEB_CLIENT_URL}/checkout?success=true`);
    const defaultCancelUrl = cancelUrl || `${process.env.WASP_WEB_CLIENT_URL}/subscription?canceled=true`

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