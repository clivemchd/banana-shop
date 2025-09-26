import { PaymentPlanId, paymentPlans } from './plans';
import { paymentProcessor } from './payment-processor';
import { HttpError } from 'wasp/server';

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
  
  console.log('🚀 Generating checkout session for plan:', paymentPlanId, 'billing cycle:', billingCycle);
  
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const userId = context.user.id;
  const userEmail = context.user.email;
  
  console.log('👤 User info:', { userId, userEmail });
  
  if (!userEmail) {
    throw new HttpError(403, 'User needs an email to make a payment.');
  }

  const paymentPlan = paymentPlans[paymentPlanId];
  
  if (!paymentPlan) {
    throw new HttpError(400, `Invalid payment plan: ${paymentPlanId}`);
  }

  console.log('📋 Payment plan:', paymentPlan.name, paymentPlan.price);
  
  try {
    // Try to get the price ID first to catch configuration errors early
    const priceId = paymentPlan.getPaymentProcessorPlanId(billingCycle);
    console.log('💰 Stripe price ID:', priceId, `(${billingCycle})`);
    
    if (!priceId || priceId.includes('price_...') || priceId.includes('placeholder_')) {
      throw new HttpError(500, `Invalid Stripe price ID configured for ${paymentPlan.name} ${billingCycle}. Please check your environment variables.`);
    }
    
    const { session } = await paymentProcessor.createCheckoutSession({
      userId,
      userEmail,
      paymentPlan,
      billingCycle,
      isSubscriptionChange,
      prismaUserDelegate: context.entities.Users,
    });

    console.log('✅ Checkout session created:', session.id);

    return {
      sessionUrl: session.url,
      sessionId: session.id,
    };
  } catch (error: any) {
    console.error('❌ Error in generateCheckoutSession:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('No such price')) {
      throw new HttpError(500, 'Invalid Stripe price ID. Please check your Stripe dashboard and environment configuration.');
    }
    
    if (error.message?.includes('No such customer')) {
      throw new HttpError(500, 'Error creating Stripe customer. Please try again.');
    }
    
    if (error.message?.includes('API key')) {
      throw new HttpError(500, 'Stripe API configuration error. Please check your API keys.');
    }
    
    // Re-throw the error with original message if it's already an HttpError
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Generic error for unexpected cases
    throw new HttpError(500, `Checkout session creation failed: ${error.message}`);
  }
};

export const getCustomerPortalUrl = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.Users,
  });
};

// Debug operation to help troubleshoot subscription issues
export const getCurrentUserSubscription = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
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
    throw new HttpError(404, 'User not found');
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
};

// Manual sync operation to fix subscription status
export const syncUserSubscription = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated');
  }

  const user = await context.entities.Users.findUniqueOrThrow({
    where: {
      id: context.user.id,
    },
  });

  if (!user.paymentProcessorUserId) {
    throw new HttpError(400, 'User has no payment processor customer ID');
  }

  console.log('🔄 Syncing subscription for user:', user.email);
  console.log('💳 Customer ID:', user.paymentProcessorUserId);

  try {
    // Import Stripe here to avoid circular dependencies
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Fetch subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.paymentProcessorUserId,
      status: 'all',
      limit: 10
    });

    console.log('📋 Found subscriptions from Stripe:', subscriptions.data.length);
    
    if (subscriptions.data.length === 0) {
      console.log('❌ No subscriptions found in Stripe for this customer');
      return {
        success: false,
        message: 'No subscriptions found in Stripe',
        stripeCustomerId: user.paymentProcessorUserId
      };
    }

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find((sub: any) => sub.status === 'active');
    const latestSubscription = subscriptions.data[0]; // Most recent
    
    console.log('🔍 Active subscription:', activeSubscription?.id || 'none');
    console.log('🔍 Latest subscription:', latestSubscription?.id, 'status:', latestSubscription?.status);

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