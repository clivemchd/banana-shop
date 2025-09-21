import { stripe, getStripeWebhookSecret } from './stripe-client';
import type { MiddlewareConfigFn } from 'wasp/server';
import { HttpError } from 'wasp/server';

export const stripeWebhook = async (request: any, response: any, context: any) => {
  const body = request.body;
  const signature = request.headers['stripe-signature'];

  if (!signature) {
    console.error('No Stripe signature found in headers');
    throw new HttpError(400, 'No Stripe signature found');
  }

  let event: any;

  try {
    // Verify webhook signature following Stripe documentation
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());
    console.log(`✅ Webhook signature verified. Event type: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    throw new HttpError(400, `Webhook signature verification failed: ${err.message}`);
  }

  // Handle the event based on type
  try {
    switch (event.type) {
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
      
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }
    
    console.log(`✅ Successfully processed webhook: ${event.type}`);
  } catch (error: any) {
    console.error(`❌ Error processing webhook ${event.type}:`, error);
    throw new HttpError(500, `Error processing webhook: ${error.message}`);
  }

  return { received: true, eventType: event.type };
};

// Handle subscription created
async function handleSubscriptionCreated(subscription: any, context: any) {
  console.log('🆕 Subscription created:', subscription.id);
  
  // Update user subscription status in database
  if (subscription.customer) {
    try {
      await context.entities.Users.updateMany({
        where: { stripeCustomerId: subscription.customer },
        data: { 
          subscriptionStatus: 'active',
          subscriptionId: subscription.id,
          // Add other subscription details as needed
        }
      });
      console.log('✅ User subscription status updated to active');
    } catch (error) {
      console.error('❌ Failed to update user subscription status:', error);
    }
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: any, context: any) {
  console.log('📝 Subscription updated:', subscription.id);
  
  if (subscription.customer) {
    try {
      await context.entities.Users.updateMany({
        where: { stripeCustomerId: subscription.customer },
        data: { 
          subscriptionStatus: subscription.status,
          subscriptionId: subscription.id,
        }
      });
      console.log(`✅ User subscription status updated to ${subscription.status}`);
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
      await context.entities.Users.updateMany({
        where: { stripeCustomerId: subscription.customer },
        data: { 
          subscriptionStatus: 'deleted',
          subscriptionId: null,
        }
      });
      console.log('✅ User subscription status updated to deleted');
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

export const stripeMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // For Wasp 0.17+, middlewareConfig is a Map
  const newConfig = new Map(middlewareConfig);
  
  // Add express.raw() middleware for Stripe webhooks to preserve raw body
  // This is essential for webhook signature verification
  newConfig.set('rawBody', (req: any, res: any, next: any) => {
    // Only apply raw body parsing for webhook endpoints
    if (req.originalUrl && req.originalUrl.includes('/payments-webhook')) {
      // Save the original body as buffer for signature verification
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk: string) => {
        data += chunk;
      });
      req.on('end', () => {
        req.body = data;
        next();
      });
    } else {
      next();
    }
  });
  
  return newConfig;
};