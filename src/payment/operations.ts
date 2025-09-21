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
};

export const generateCheckoutSession = async (args: CheckoutSessionArgs | PaymentPlanId, context: any) => {
  // Handle backward compatibility - if args is just a PaymentPlanId
  const { paymentPlanId, billingCycle = 'monthly' } = typeof args === 'string' 
    ? { paymentPlanId: args, billingCycle: 'monthly' as const }
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
  };
};