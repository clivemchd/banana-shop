import { stripe } from './stripe-client';
import { LAUNCH_COUPON_CODE, isLaunchOfferActive, paymentPlans } from '../plans';
import type Stripe from 'stripe';

export interface CreateStripeCheckoutSessionArgs {
  priceId: string;
  customerId: string;
  mode: 'subscription' | 'payment';
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export async function createStripeCheckoutSession({
  priceId,
  customerId,
  mode,
  successUrl = `${process.env.WASP_WEB_CLIENT_URL}/checkout?success=true`,
  cancelUrl = `${process.env.WASP_WEB_CLIENT_URL}/pricing?canceled=true`,
  metadata = {},
}: CreateStripeCheckoutSessionArgs): Promise<Stripe.Checkout.Session> {
  
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    // Enable customer portal for subscription management
    ...(mode === 'subscription' && {
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    }),
  };

  // Apply launch offer coupon for subscriptions if active
  if (mode === 'subscription' && isLaunchOfferActive()) {
    sessionConfig.discounts = [
      {
        coupon: LAUNCH_COUPON_CODE,
      },
    ];
  }

  return stripe.checkout.sessions.create(sessionConfig);
}

export async function fetchStripeCustomer(email: string): Promise<Stripe.Customer> {
  // First, try to find existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer if not found
  return stripe.customers.create({
    email,
    metadata: {
      source: 'nano-studio',
    },
  });
}

export async function getStripeCustomerPortalUrl(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.WASP_WEB_CLIENT_URL}/dashboard`,
  });

  return session.url;
}

export interface CreateScheduledSubscriptionArgs {
  userId: string;
  userEmail: string;
  paymentPlan: any;
  billingCycle: 'monthly' | 'annual';
  currentSubscriptionEndDate: Date;
  prismaUserDelegate: any;
}

export async function createScheduledSubscriptionChange({
  userId,
  userEmail,
  paymentPlan,
  billingCycle,
  currentSubscriptionEndDate,
  prismaUserDelegate
}: CreateScheduledSubscriptionArgs) {
  console.log('📅 Creating scheduled subscription change for user:', userId);
  
  const customer = await fetchStripeCustomer(userEmail);
  
  // Create a subscription schedule to start the new plan when current subscription ends
  const subscriptionSchedule = await stripe.subscriptionSchedules.create({
    customer: customer.id,
    start_date: Math.floor(currentSubscriptionEndDate.getTime() / 1000), // Convert to Unix timestamp
    end_behavior: 'release', // Release the subscription to continue normally after schedule ends
    phases: [
      {
        items: [
          {
            price: paymentPlan.getPaymentProcessorPlanId(billingCycle),
            quantity: 1,
          },
        ],
        iterations: 1, // Run for one billing cycle, then release to normal subscription
      },
    ],
    metadata: {
      userId,
      planId: Object.keys(paymentPlans).find(
        key => paymentPlans[key as keyof typeof paymentPlans] === paymentPlan
      ) || 'unknown',
      isScheduledChange: 'true',
    },
  });

  console.log('✅ Subscription schedule created:', subscriptionSchedule.id);
  console.log('📅 New subscription will start on:', new Date(currentSubscriptionEndDate).toISOString());

  // Return a session-like object for consistency with the existing API
  return {
    session: {
      url: `${process.env.WASP_WEB_CLIENT_URL}/subscriptions?scheduled=true`,
      id: subscriptionSchedule.id,
    }
  };
}