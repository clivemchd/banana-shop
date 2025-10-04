import { PaymentPlanId, paymentPlans } from './plans';
import { paymentProcessor } from './payment-processor';
import { HttpError } from 'wasp/server';
import { logger, handleError, AuthenticationError, ValidationError, PaymentProcessingError, NotFoundError } from '../utils';

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

export type CheckoutSessionArgs = {
  paymentPlanId: PaymentPlanId;
  billingCycle?: 'monthly' | 'annual';
  isSubscriptionChange?: boolean;
};

export const generateCheckoutSession = async (args: CheckoutSessionArgs | PaymentPlanId, context: any) => {
  // Handle backward compatibility - if args is just a PaymentPlanId
  const { paymentPlanId, billingCycle = 'monthly', isSubscriptionChange = false } = typeof args === 'string' 
    ? { paymentPlanId: args, billingCycle: 'monthly' as const, isSubscriptionChange: false }
    : args;
  
  try {
    logger.info('Generating checkout session', { paymentPlanId, billingCycle });
    
    if (!context.user) {
      throw new AuthenticationError();
    }

    const userId = context.user.id;
    const userEmail = context.user.email;
    
    logger.debug('User checkout session request', { userId, userEmail });
  
    if (!userEmail) {
      throw new ValidationError('User needs an email to make a payment.');
    }

    const paymentPlan = paymentPlans[paymentPlanId];
    
    if (!paymentPlan) {
      throw new ValidationError(`Invalid payment plan: ${paymentPlanId}`);
    }

    logger.debug('Payment plan selected', { plan: paymentPlan.name, price: paymentPlan.price });
    
    // Try to get the price ID first to catch configuration errors early
    const priceId = paymentPlan.getPaymentProcessorPlanId(billingCycle);
    logger.debug('Stripe price ID retrieved', { priceId, billingCycle });
    
    if (!priceId || priceId.includes('price_...') || priceId.includes('placeholder_')) {
      throw new PaymentProcessingError(`Invalid Stripe price ID configured for ${paymentPlan.name} ${billingCycle}. Please check your environment variables.`);
    }
    
    const { session } = await paymentProcessor.createCheckoutSession({
      userId,
      userEmail,
      paymentPlan,
      billingCycle,
      isSubscriptionChange,
      prismaUserDelegate: context.entities.Users,
    });

    logger.info('Checkout session created', { sessionId: session.id, userId });

    return {
      sessionUrl: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'generateCheckoutSession',
      userId: context?.user?.id,
      paymentPlanId,
      billingCycle,
    });
  }
};

export const getCustomerPortalUrl = async (_args: any, context: any) => {
  try {
    if (!context.user) {
      throw new AuthenticationError();
    }

    return paymentProcessor.fetchCustomerPortalUrl({
      userId: context.user.id,
      prismaUserDelegate: context.entities.Users,
    });
  } catch (error) {
    throw handleError(error, {
      operation: 'getCustomerPortalUrl',
      userId: context?.user?.id,
    });
  }
};

// Debug operation to help troubleshoot subscription issues
export const getCurrentUserSubscription = async (_args: any, context: any) => {
  try {
    if (!context.user) {
      throw new AuthenticationError();
    }

    const user = await context.entities.Users.findUnique({
      where: { id: context.user.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        paymentProcessorUserId: true,
        datePaid: true,
        credits: true,
        billingCycle: true,
        billingEndDate: true,
        isPlanRenewed: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      isSubscribed: user.subscriptionStatus === 'active',
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      datePaid: user.datePaid,
      credits: user.credits,
      paymentProcessorUserId: user.paymentProcessorUserId,
      billingCycle: user.billingCycle,
      billingEndDate: user.billingEndDate,
      isPlanRenewed: user.isPlanRenewed,
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'getCurrentUserSubscription',
      userId: context?.user?.id,
    });
  }
};

// Manual sync operation to fix subscription status
export const syncUserSubscription = async (args: any, context: any) => {
  try {
    if (!context.user) {
      throw new AuthenticationError();
    }

    const user = await context.entities.Users.findUniqueOrThrow({
      where: {
        id: context.user.id,
      },
    });

    if (!user.paymentProcessorUserId) {
      throw new ValidationError('User has no payment processor customer ID');
    }

    logger.info('Syncing subscription for user', { email: user.email, customerId: user.paymentProcessorUserId });

    // Import Stripe here to avoid circular dependencies
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Fetch subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.paymentProcessorUserId,
      status: 'all',
      limit: 10
    });

    logger.debug('Subscriptions found from Stripe', { count: subscriptions.data.length });
    
    if (subscriptions.data.length === 0) {
      logger.warn('No subscriptions found in Stripe', { customerId: user.paymentProcessorUserId });
      return {
        success: false,
        message: 'No subscriptions found in Stripe',
        stripeCustomerId: user.paymentProcessorUserId
      };
    }

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find((sub: any) => sub.status === 'active');
    const latestSubscription = subscriptions.data[0]; // Most recent
    
    logger.debug('Subscription details', { 
      activeSubscriptionId: activeSubscription?.id || 'none',
      latestSubscriptionId: latestSubscription?.id,
      latestStatus: latestSubscription?.status 
    });

    // Use active subscription if available, otherwise use latest
    const subscriptionToSync = activeSubscription || latestSubscription;

    if (subscriptionToSync) {
      // Extract plan from subscription
      const priceId = subscriptionToSync.items?.data?.[0]?.price?.id;
      console.log('💰 Price ID:', priceId);
      
      // Plan mapping based on price amounts and known price IDs
      let planName: string | null = null;
      const amount = subscriptionToSync.items?.data?.[0]?.price?.unit_amount;
      
      // Map based on price ID or amount
      if (priceId === 'price_1S9a1BKPBVKSP3Z42CpnaDkv' || amount === 1900) {
        planName = 'pro';  // $19.00 plan
      } else if (priceId === 'price_1S9a02KPBVKSP3Z4slA5Lv0y' || amount === 900) {
        planName = 'starter';  // $9.00 plan
      } else if (amount === 2900) {
        planName = 'business';  // $29.00 plan (if exists)
      } else if (priceId && priceId.includes('pro')) {
        planName = 'pro';
      } else if (priceId && priceId.includes('starter')) {
        planName = 'starter';
      } else if (priceId && priceId.includes('business')) {
        planName = 'business';
      } else {
        // Fallback: detect by amount
        if (amount >= 1500) {
          planName = 'pro';
        } else if (amount >= 800) {
          planName = 'starter';
        }
      }
      
      console.log('📦 Inferred plan:', planName);

      // Update user in database
      const updatedUser = await context.entities.Users.update({
        where: { id: context.user.id },
        data: {
          subscriptionStatus: subscriptionToSync.status,
          subscriptionPlan: planName as string | null,
          datePaid: subscriptionToSync.status === 'active' ? new Date() : user.datePaid,
        }
      });

      console.log('✅ User subscription synced successfully');
      
      return {
        success: true,
        message: 'Subscription synced successfully',
        stripeSubscription: {
          id: subscriptionToSync.id,
          status: subscriptionToSync.status,
          priceId: priceId
        },
        updatedData: {
          subscriptionStatus: updatedUser.subscriptionStatus,
          subscriptionPlan: updatedUser.subscriptionPlan,
          datePaid: updatedUser.datePaid
        }
      };
    } else {
      return {
        success: false,
        message: 'No valid subscription found to sync'
      };
    }

  } catch (error: any) {
    console.error('❌ Error syncing subscription:', error);
    throw new HttpError(500, `Failed to sync subscription: ${error.message}`);
  }
};