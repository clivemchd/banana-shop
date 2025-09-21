import { PaymentPlanId } from '../payment/plans';
import type { Users } from 'wasp/entities';
import { HttpError } from 'wasp/server';

export type UserSubscriptionInfo = {
  isSubscribed: boolean;
  subscriptionStatus: string | null;
  subscriptionPlan: PaymentPlanId | null;
  datePaid: Date | null;
  credits: number;
  paymentProcessorUserId: string | null;
};

export const getCurrentUserSubscription = async (_args: any, context: any): Promise<UserSubscriptionInfo> => {
  if (!context.user) {
    throw new HttpError(401, 'User must be logged in to view subscription');
  }

  const user = await context.entities.Users.findUnique({
    where: { id: context.user.id },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      datePaid: true,
      credits: true,
      paymentProcessorUserId: true,
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return {
    isSubscribed: user.subscriptionStatus === 'active',
    subscriptionStatus: user.subscriptionStatus,
    subscriptionPlan: user.subscriptionPlan as PaymentPlanId | null,
    datePaid: user.datePaid,
    credits: user.credits || 0,
    paymentProcessorUserId: user.paymentProcessorUserId,
  };
};