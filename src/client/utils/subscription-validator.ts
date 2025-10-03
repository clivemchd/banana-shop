import { getCurrentUserCredits } from 'wasp/client/operations';

export interface SubscriptionValidationResult {
  isValid: boolean;
  error?: string;
  credits?: number;
}

export interface UserSubscriptionInfo {
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  credits: number;
}

/**
 * Validates if user has an active subscription and enough credits for an operation
 */
export const validateSubscriptionAndCredits = async (
  requiredCredits: number,
  userInfo: UserSubscriptionInfo
): Promise<SubscriptionValidationResult> => {
  // Check if user has active subscription
  if (!userInfo.subscriptionStatus || userInfo.subscriptionStatus !== 'active') {
    return {
      isValid: false,
      error: 'You need an active subscription to use this feature. Please subscribe to continue.',
    };
  }

  // Check if user has enough credits
  if (userInfo.credits < requiredCredits) {
    return {
      isValid: false,
      error: `Insufficient credits. You need ${requiredCredits} credits but only have ${userInfo.credits} remaining. Please upgrade your plan or wait for your credits to renew.`,
    };
  }

  return {
    isValid: true,
    credits: userInfo.credits,
  };
};

/**
 * Fetches current user's credits from the server
 */
export const fetchUserCredits = async (): Promise<number> => {
  try {
    const result = await getCurrentUserCredits();
    return result.credits;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw new Error('Failed to fetch credit balance. Please try again.');
  }
};

/**
 * Credit costs for different operations (should match server-side)
 */
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 0.5,
  IMAGE_EDIT: 1,
  IMAGE_UPSCALE: 1.5,
  IMAGE_VARIATION: 0.5,
} as const;
