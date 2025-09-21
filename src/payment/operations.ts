import { PaymentPlanId, paymentPlans } from './plans';
import { paymentProcessor } from './payment-processor';
import { HttpError } from 'wasp/server';

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

export const generateCheckoutSession = async (rawPaymentPlanId: PaymentPlanId, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const paymentPlanId = rawPaymentPlanId;

  const userId = context.user.id;
  const userEmail = context.user.email;
  
  if (!userEmail) {
    throw new HttpError(403, 'User needs an email to make a payment.');
  }

  const paymentPlan = paymentPlans[paymentPlanId];
  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.Users,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
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