import { stripe, getStripeWebhookSecret } from './stripe-client';
import type { MiddlewareConfigFn } from 'wasp/server';
import { HttpError } from 'wasp/server';
import express from 'express';
import { syncCreditsWithSubscription } from '../../credits/credits-operations';

export const stripeWebhook = async (request: any, response: any, context: any) => {
  const body = request.body;
  const signature = request.headers['stripe-signature'];

  if (!signature) {
    console.error('No Stripe signature found in headers');
    return response.status(400).send('No Stripe signature found');
  }

  let event: any;

  try {
    // Verify webhook signature following Stripe documentation
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());
    console.log(`✅ Webhook signature verified. Event ID: ${event.id}, Type: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return response.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  // Handle the event
  const eventType = event.type;
  const eventId = event.id;
  
  console.log(`✅ Webhook received: ${eventType} (${eventId})`);
  
  // Process asynchronously without blocking the response
  setImmediate(async () => {
    try {
      console.log(`🔄 Starting async processing for ${eventType} (${eventId})`);
      await processWebhookEvent(event, context);
      console.log(`✅ Completed async processing for ${eventType} (${eventId})`);
    } catch (error: any) {
      console.error(`❌ Async processing failed for webhook ${eventType} (${eventId}):`, error);
    }
  });
  
  // Return a 200 response to acknowledge receipt of the event (Stripe's recommended approach)
  response.send();
};

// Separate function to process webhook events
async function processWebhookEvent(event: any, context: any) {
  const eventType = event.type;
  const eventId = event.id;
  
  console.log(`🔄 Processing webhook event: ${eventType} (${eventId})`);

  try {
    switch (eventType) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, context);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, context);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, context);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, context);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, context);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, context);
        break;

      case 'subscription_schedule.released':
        await handleSubscriptionScheduleReleased(event.data.object, context);
        break;

      case 'subscription_schedule.created':
        await handleSubscriptionScheduleCreated(event.data.object, context);
        break;
      
      default:
        console.log(`🔔 Ignoring unhandled event type: ${eventType} (${eventId})`);
        return;
    }
    
    console.log(`✅ Successfully processed webhook: ${eventType} (${eventId})`);
  } catch (error: any) {
    console.error(`❌ Error processing webhook ${eventType} (${eventId}):`, error);
    // Don't throw here since we're in async processing
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: any, context: any) {
  console.log('🆕 Subscription created:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    plan: getPaymentPlanFromSubscription(subscription)
  });
  
  // Update user subscription status in database
  if (subscription.customer) {
    try {
      // First, check if user exists
      const existingUser = await context.entities.Users.findFirst({
        where: { paymentProcessorUserId: subscription.customer }
      });
      
      if (!existingUser) {
        console.error('❌ No user found with paymentProcessorUserId:', subscription.customer);
        return;
      }
      
      console.log('👤 Found user:', { id: existingUser.id, email: existingUser.email });
      
      // First, cancel any existing active subscriptions for this customer to prevent duplicates
      const cancelResult = await context.entities.Users.updateMany({
        where: { 
          paymentProcessorUserId: subscription.customer,
          subscriptionStatus: 'active'
        },
        data: { 
          subscriptionStatus: 'canceled'
        }
      });
      
      console.log('🔄 Canceled existing active subscriptions, affected rows:', cancelResult.count);

      // Then set the new subscription as active
      const billingCycle = getBillingCycleFromSubscription(subscription);
      const endDate = getSubscriptionEndDate(subscription);
      
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: subscription.customer },
        data: { 
          subscriptionStatus: subscription.status || 'active',
          subscriptionPlan: getPaymentPlanFromSubscription(subscription),
          billingCycle: billingCycle,
          billingEndDate: endDate,
          datePaid: new Date(),
          isPlanRenewed: true, // New subscriptions are always set to renew
          // Clear any previous scheduled plan fields for new subscriptions
          scheduledPlanId: null,
          scheduledBillingCycle: null,
          scheduledStartDate: null,
        }
      });
      
      console.log('✅ User subscription status updated, affected rows:', result.count);
      
      // Verify the update
      const updatedUser = await context.entities.Users.findFirst({
        where: { paymentProcessorUserId: subscription.customer }
      });
      
      console.log('🔍 Updated user data:', {
        subscriptionStatus: updatedUser?.subscriptionStatus,
        subscriptionPlan: updatedUser?.subscriptionPlan,
        billingCycle: updatedUser?.billingCycle,
        billingEndDate: updatedUser?.billingEndDate,
        datePaid: updatedUser?.datePaid
      });

      // Sync credits with the new subscription plan
      if (updatedUser && updatedUser.subscriptionStatus === 'active' && updatedUser.subscriptionPlan) {
        try {
          const creditSync = await syncCreditsWithSubscription(updatedUser.id, context);
          console.log('💳 Credits synced:', creditSync);
        } catch (creditError) {
          console.error('❌ Failed to sync credits:', creditError);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to update user subscription status:', error);
    }
  } else {
    console.error('❌ No customer ID found in subscription object');
  }
}

// Helper function to extract plan from subscription
function getPaymentPlanFromSubscription(subscription: any): string | null {
  try {
    console.log('🔍 Extracting plan from subscription:', subscription.id);
    
    // Log subscription structure for debugging
    console.log('📋 Subscription items:', subscription.items?.data?.length || 0);
    
    // Extract the price ID from subscription items
    const priceId = subscription.items?.data?.[0]?.price?.id;
    console.log('💰 Price ID found:', priceId);
    
    if (!priceId) {
      console.log('❌ No price ID found in subscription items');
      return null;
    }

    // Map price IDs to plan names - includes both mock and real price IDs
    const priceToplan: Record<string, string> = {
      // Monthly plans (mock for development)
      'price_mock_starter_9_monthly': 'starter',
      'price_mock_pro_19_monthly': 'pro', 
      'price_mock_business_89_monthly': 'business',
      // Annual plans (mock for development)
      'price_mock_starter_86_annual': 'starter',
      'price_mock_pro_182_annual': 'pro',
      'price_mock_business_854_annual': 'business',
      // Real price IDs from your Stripe account
      'price_1S9a1BKPBVKSP3Z42CpnaDkv': 'pro',     // $19.00 plan
      'price_1S9a02KPBVKSP3Z4slA5Lv0y': 'starter', // $9.00 plan
    };

    const planName = priceToplan[priceId];
    console.log('📦 Mapped plan name:', planName);
    
    if (!planName) {
      console.log('⚠️ Unknown price ID:', priceId);
      console.log('📋 Available price mappings:', Object.keys(priceToplan));
      // Return a default or try to infer from price metadata
      return inferPlanFromPrice(subscription.items.data[0].price);
    }
    
    return planName;
  } catch (error) {
    console.error('❌ Error extracting plan from subscription:', error);
    return null;
  }
}

// Helper function to get payment plan from price ID directly
function getPaymentPlanFromPriceId(priceId: string): string | null {
  const priceToplan: Record<string, string> = {
    // Monthly plans (mock for development)
    'price_mock_starter_9_monthly': 'starter',
    'price_mock_pro_19_monthly': 'pro', 
    'price_mock_business_89_monthly': 'business',
    // Annual plans (mock for development)
    'price_mock_starter_86_annual': 'starter',
    'price_mock_pro_182_annual': 'pro',
    'price_mock_business_854_annual': 'business',
    // Real price IDs from your Stripe account
    'price_1S9a1BKPBVKSP3Z42CpnaDkv': 'pro',     // $19.00 plan
    'price_1S9a02KPBVKSP3Z4slA5Lv0y': 'starter', // $9.00 plan
  };
  
  return priceToplan[priceId] || null;
}

// Helper function to get billing interval from price ID
async function getIntervalFromPriceId(priceId: string): Promise<string> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return price.recurring?.interval || 'monthly';
  } catch (error) {
    console.error('Failed to fetch price details:', error);
    return 'monthly'; // Default fallback
  }
}

// Helper function to infer plan from price object when exact mapping is not found
function inferPlanFromPrice(price: any): string | null {
  try {
    console.log('🔍 Inferring plan from price object:', {
      id: price.id,
      nickname: price.nickname,
      unit_amount: price.unit_amount,
      currency: price.currency
    });
    
    // Try to infer from nickname if available
    if (price.nickname) {
      const nickname = price.nickname.toLowerCase();
      if (nickname.includes('starter')) return 'starter';
      if (nickname.includes('pro')) return 'pro';
      if (nickname.includes('business')) return 'business';
    }
    
    // Try to infer from price amount (in cents)
    const amount = price.unit_amount / 100; // Convert from cents to dollars
    console.log('💵 Price amount in dollars:', amount);
    
    // Match common price points
    if (amount === 9) return 'starter';
    if (amount === 19) return 'pro';
    if (amount === 89) return 'business';
    
    // Monthly vs annual amounts
    if (amount === 7.17 || amount === 86) return 'starter'; // Annual starter
    if (amount === 15.17 || amount === 182) return 'pro';   // Annual pro
    if (amount === 71.17 || amount === 854) return 'business'; // Annual business
    
    console.log('❓ Could not infer plan from price');
    return null;
  } catch (error) {
    console.error('❌ Error inferring plan from price:', error);
    return null;
  }
}

// Helper function to extract billing cycle from subscription
function getBillingCycleFromSubscription(subscription: any): string | null {
  try {
    console.log('🔍 Extracting billing cycle from subscription:', subscription.id);
    
    // Get the recurring interval from the first subscription item
    const recurringInterval = subscription.items?.data?.[0]?.price?.recurring?.interval;
    console.log('📅 Recurring interval found:', recurringInterval);
    
    if (recurringInterval === 'month') {
      return 'monthly';
    } else if (recurringInterval === 'year') {
      return 'annual';
    }
    
    console.log('❓ Unknown or missing billing interval');
    return null;
  } catch (error) {
    console.error('❌ Error extracting billing cycle from subscription:', error);
    return null;
  }
}

// Helper function to get subscription end date
function getSubscriptionEndDate(subscription: any): Date | null {
  try {
    console.log('🔍 Extracting end date from subscription:', subscription.id);
    
    // For active subscriptions, use current_period_end
    // For cancelled subscriptions, they may have a different end date
    let endTimestamp: number | null = null;
    
    if (subscription.status === 'active' && subscription.current_period_end) {
      endTimestamp = subscription.current_period_end;
      console.log('📅 Using current_period_end for active subscription:', endTimestamp);
    } else if (subscription.canceled_at && subscription.cancel_at_period_end) {
      // If cancelled but set to end at period end, use current_period_end
      endTimestamp = subscription.current_period_end;
      console.log('📅 Using current_period_end for cancelled subscription (end at period end):', endTimestamp);
    } else if (subscription.canceled_at) {
      // If immediately cancelled, use cancelled_at timestamp
      endTimestamp = subscription.canceled_at;
      console.log('📅 Using canceled_at for immediately cancelled subscription:', endTimestamp);
    }
    
    if (endTimestamp) {
      const endDate = new Date(endTimestamp * 1000); // Convert Unix timestamp to Date
      console.log('📅 Calculated end date:', endDate.toISOString());
      return endDate;
    }
    
    console.log('❓ No valid end date found');
    return null;
  } catch (error) {
    console.error('❌ Error extracting end date from subscription:', error);
    return null;
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: any, context: any) {
  console.log('📝 Subscription updated:', subscription.id, 'status:', subscription.status);
  
  if (subscription.customer) {
    try {
      const billingCycle = getBillingCycleFromSubscription(subscription);
      const endDate = getSubscriptionEndDate(subscription);
      
      // Check if subscription is set to cancel at period end
      const isPlanRenewed = subscription.status === 'active' ? !subscription.cancel_at_period_end : false;
      console.log('🔄 Subscription update - cancel_at_period_end:', subscription.cancel_at_period_end, 'isPlanRenewed:', isPlanRenewed);
      
      // Check if there's a scheduled plan change (when subscription has pending changes)
      let scheduledPlanData = {};
      if (subscription.schedule) {
        console.log('📅 Subscription has a schedule attached:', subscription.schedule);
        try {
          // Fetch the schedule to get details about the upcoming change
          const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule);
          console.log('🔍 Schedule details:', schedule);
          
          // Get the next phase (upcoming plan change)
          const nextPhase = schedule.phases?.find((phase: any) => phase.start_date > Math.floor(Date.now() / 1000));
          if (nextPhase && nextPhase.items?.length > 0) {
            const priceItem = nextPhase.items[0].price;
            const priceId = typeof priceItem === 'string' ? priceItem : priceItem?.id;
            
            const nextPlanId = priceId ? getPaymentPlanFromPriceId(priceId) : null;
            const nextBillingCycle = priceId ? await getIntervalFromPriceId(priceId) : 'monthly';
            
            scheduledPlanData = {
              scheduledPlanId: nextPlanId,
              scheduledBillingCycle: nextBillingCycle,
              scheduledStartDate: new Date(nextPhase.start_date * 1000),
            };
            
            console.log('📋 Scheduled plan change detected:', scheduledPlanData);
          }
        } catch (scheduleError) {
          console.error('❌ Failed to fetch subscription schedule:', scheduleError);
        }
      } else {
        // Clear scheduled plan data if no schedule is attached
        scheduledPlanData = {
          scheduledPlanId: null,
          scheduledBillingCycle: null,
          scheduledStartDate: null,
        };
      }
      
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: subscription.customer },
        data: { 
          subscriptionStatus: subscription.status,
          subscriptionPlan: getPaymentPlanFromSubscription(subscription),
          billingCycle: billingCycle,
          billingEndDate: endDate,
          isPlanRenewed: isPlanRenewed,
          ...scheduledPlanData,
          ...(subscription.status === 'active' && { datePaid: new Date() })
        }
      });
      console.log(`✅ User subscription status updated to ${subscription.status}, affected rows:`, result.count);

      // Sync credits if subscription is active
      if (subscription.status === 'active') {
        try {
          // Find the user to sync credits
          const user = await context.entities.Users.findFirst({
            where: { paymentProcessorUserId: subscription.customer }
          });
          
          if (user) {
            const creditSync = await syncCreditsWithSubscription(user.id, context);
            console.log('💳 Credits synced for updated subscription:', creditSync);
          }
        } catch (creditError) {
          console.error('❌ Failed to sync credits on subscription update:', creditError);
        }
      }
    } catch (error) {
      console.error('❌ Failed to update user subscription status:', error);
    }
  }
}

// Handle subscription deleted/cancelled
async function handleSubscriptionDeleted(subscription: any, context: any) {
  console.log('❌ Subscription deleted:', subscription.id);
  
  if (subscription.customer) {
    try {
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: subscription.customer },
        data: { 
          subscriptionStatus: 'canceled',
          subscriptionPlan: null,
          billingCycle: null,
          billingEndDate: null,
          isPlanRenewed: false,
          credits: 0, // Reset credits to zero when subscription is cancelled
          // Clear scheduled plan fields when subscription is completely cancelled
          scheduledPlanId: null,
          scheduledBillingCycle: null,
          scheduledStartDate: null,
        }
      });
      console.log('✅ User subscription status updated to canceled and credits reset to 0, affected rows:', result.count);
    } catch (error) {
      console.error('❌ Failed to update user subscription status:', error);
    }
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: any, context: any) {
  console.log('💰 Payment succeeded for invoice:', invoice.id);
  
  // You can add logic here to:
  // - Send confirmation emails
  // - Update credits or usage limits
  // - Log payment history
}

// Handle failed payment
async function handlePaymentFailed(invoice: any, context: any) {
  console.log('❌ Payment failed for invoice:', invoice.id);
  
  // You can add logic here to:
  // - Send payment failure notifications
  // - Update subscription status if needed
  // - Retry payment logic
}

// Handle checkout session completed
async function handleCheckoutCompleted(session: any, context: any) {
  console.log('🛒 Checkout session completed:', session.id);
  console.log('🔍 Customer ID:', session.customer);
  console.log('🔍 Subscription ID:', session.subscription);
  
  if (session.customer && session.subscription) {
    try {
      // Fetch the subscription details from Stripe to get accurate data
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      console.log('📋 Subscription details:', {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer
      });
      
      // Update user with subscription info
      const billingCycle = getBillingCycleFromSubscription(subscription);
      const endDate = getSubscriptionEndDate(subscription);
      
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: session.customer },
        data: { 
          subscriptionStatus: subscription.status,
          subscriptionPlan: getPaymentPlanFromSubscription(subscription),
          billingCycle: billingCycle,
          billingEndDate: endDate,
          datePaid: new Date(),
          isPlanRenewed: true, // New subscriptions are always set to renew
          // Clear any scheduled plan fields for new checkouts
          scheduledPlanId: null,
          scheduledBillingCycle: null,
          scheduledStartDate: null,
        }
      });
      
      console.log('✅ User subscription updated via checkout completion, affected rows:', result.count);
    } catch (error) {
      console.error('❌ Failed to process checkout completion:', error);
    }
  }
}

// Handle subscription schedule created
async function handleSubscriptionScheduleCreated(subscriptionSchedule: any, context: any) {
  console.log('📅 Subscription schedule created:', {
    id: subscriptionSchedule.id,
    customer: subscriptionSchedule.customer,
    status: subscriptionSchedule.status,
    startDate: new Date(subscriptionSchedule.phases[0]?.start_date * 1000).toISOString()
  });
  
  if (subscriptionSchedule.customer) {
    try {
      // Get the scheduled plan details from the phases
      const nextPhase = subscriptionSchedule.phases?.find((phase: any) => phase.start_date > Math.floor(Date.now() / 1000));
      if (nextPhase && nextPhase.items?.length > 0) {
        const priceItem = nextPhase.items[0].price;
        const priceId = typeof priceItem === 'string' ? priceItem : priceItem?.id;
        
        const scheduledPlanId = priceId ? getPaymentPlanFromPriceId(priceId) : null;
        const scheduledBillingCycle = priceId ? await getIntervalFromPriceId(priceId) : 'monthly';
        const scheduledStartDate = new Date(nextPhase.start_date * 1000);
        
        // Update user with scheduled plan information
        const result = await context.entities.Users.updateMany({
          where: { paymentProcessorUserId: subscriptionSchedule.customer },
          data: { 
            scheduledPlanId: scheduledPlanId,
            scheduledBillingCycle: scheduledBillingCycle,
            scheduledStartDate: scheduledStartDate,
          }
        });
        
        console.log('✅ User scheduled plan data updated, affected rows:', result.count);
        console.log('📋 Scheduled plan details:', {
          scheduledPlanId,
          scheduledBillingCycle,
          scheduledStartDate: scheduledStartDate.toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Failed to update scheduled plan data:', error);
    }
  }
  
  // Log the scheduled subscription change
  console.log('✅ User will have their subscription changed according to the schedule');
}

// Handle subscription schedule released (when it converts to a regular subscription)
async function handleSubscriptionScheduleReleased(subscriptionSchedule: any, context: any) {
  console.log('🚀 Subscription schedule released and converted to regular subscription:', {
    id: subscriptionSchedule.id,
    customer: subscriptionSchedule.customer,
    subscriptionId: subscriptionSchedule.subscription
  });

  if (subscriptionSchedule.customer && subscriptionSchedule.subscription) {
    try {
      // Fetch the new subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionSchedule.subscription);
      
      console.log('📋 New subscription details from schedule:', {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer
      });
      
      // Update user with the new subscription info
      const billingCycle = getBillingCycleFromSubscription(subscription);
      const endDate = getSubscriptionEndDate(subscription);
      
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: subscriptionSchedule.customer },
        data: { 
          subscriptionStatus: subscription.status,
          subscriptionPlan: getPaymentPlanFromSubscription(subscription),
          billingCycle: billingCycle,
          billingEndDate: endDate,
          datePaid: new Date(),
          isPlanRenewed: true, // New subscriptions are always set to renew
          // Clear scheduled plan fields since they're now active
          scheduledPlanId: null,
          scheduledBillingCycle: null,
          scheduledStartDate: null,
        }
      });
      
      console.log('✅ User subscription updated from schedule release, affected rows:', result.count);
      
      // Sync credits with the new subscription
      const user = await context.entities.Users.findFirst({
        where: { paymentProcessorUserId: subscriptionSchedule.customer }
      });
      
      if (user) {
        try {
          const creditSync = await syncCreditsWithSubscription(user.id, context);
          console.log('💳 Credits synced for schedule-released subscription:', creditSync);
        } catch (creditError) {
          console.error('❌ Failed to sync credits on schedule release:', creditError);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to process subscription schedule release:', error);
    }
  }
}

export const stripeMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // We need to delete the default 'express.json' middleware and replace it with 'express.raw' middleware
  // because webhook data in the body of the request as raw JSON, not as JSON in the body of the request.
  middlewareConfig.delete('express.json');
  middlewareConfig.set('express.raw', express.raw({ type: 'application/json' }));
  return middlewareConfig;
};