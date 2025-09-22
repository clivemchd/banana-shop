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
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: subscription.customer },
        data: { 
          subscriptionStatus: subscription.status || 'active',
          subscriptionPlan: getPaymentPlanFromSubscription(subscription),
          datePaid: new Date(),
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

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: any, context: any) {
  console.log('📝 Subscription updated:', subscription.id, 'status:', subscription.status);
  
  if (subscription.customer) {
    try {
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: subscription.customer },
        data: { 
          subscriptionStatus: subscription.status,
          subscriptionPlan: getPaymentPlanFromSubscription(subscription),
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
        }
      });
      console.log('✅ User subscription status updated to canceled, affected rows:', result.count);
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
      const result = await context.entities.Users.updateMany({
        where: { paymentProcessorUserId: session.customer },
        data: { 
          subscriptionStatus: subscription.status,
          subscriptionPlan: getPaymentPlanFromSubscription(subscription),
          datePaid: new Date(),
        }
      });
      
      console.log('✅ User subscription updated via checkout completion, affected rows:', result.count);
    } catch (error) {
      console.error('❌ Failed to process checkout completion:', error);
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