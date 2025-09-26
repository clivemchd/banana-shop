// Utility functions for next subscription logic
import { PaymentPlanId } from '../../../server/payment/plans';

export type NextSubscriptionInfo = {
    isScheduled: boolean;
    subscriptionPlan: PaymentPlanId | null;
    scheduledStartDate: Date | null;
    billingCycle: string | null;
    // Add other fields as needed for the next subscription
};

export const getNextSubscriptionInfo = (subscription: any): NextSubscriptionInfo | null => {
    // Check if user has a scheduled plan change
    if (subscription?.scheduledPlanId && subscription?.scheduledStartDate) {
        return {
            isScheduled: true,
            subscriptionPlan: subscription.scheduledPlanId,
            scheduledStartDate: new Date(subscription.scheduledStartDate),
            billingCycle: subscription.scheduledBillingCycle || subscription.billingCycle,
        };
    }

    // Check if user has a cancelled plan (will end at billing end date)
    if (subscription?.subscriptionStatus === 'active' && 
        subscription?.isPlanRenewed === false && 
        subscription?.billingEndDate) {
        
        // This represents the end of the subscription, not a new plan
        return null;
    }

    // For now, return null if no next subscription is scheduled
    return null;
};

export const shouldShowNextSubscription = (subscription: any): boolean => {
    return getNextSubscriptionInfo(subscription) !== null;
};