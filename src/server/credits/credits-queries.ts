import { HttpError } from 'wasp/server';
import { 
  getUserCredits, 
  addCredits, 
  deductCredits, 
  hasEnoughCredits, 
  syncCreditsWithSubscription,
  getPlanCreditInfo,
  type CreditOperation 
} from './credits-operations';

/**
 * Get current user's credit balance
 */
export const getCurrentUserCredits = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be logged in to check credits');
  }

  const credits = await getUserCredits(context.user.id, context);
  
  return {
    userId: context.user.id,
    credits,
    timestamp: new Date()
  };
};

/**
 * Check if current user has enough credits for an operation
 */
export const checkUserCredits = async (
  { operation }: { operation: CreditOperation }, 
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be logged in to check credits');
  }

  return await hasEnoughCredits(context.user.id, operation, context);
};

/**
 * Deduct credits from current user (used by image generation operations)
 */
export const consumeUserCredits = async (
  { operation }: { operation: CreditOperation }, 
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be logged in to consume credits');
  }

  return await deductCredits(context.user.id, operation, context);
};

/**
 * Sync current user's credits with their subscription plan
 */
export const syncUserCredits = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be logged in to sync credits');
  }

  return await syncCreditsWithSubscription(context.user.id, context);
};

/**
 * Get credit information for all plans (for pricing display)
 */
export const getAllPlanCredits = async (_args: any, context: any) => {
  // This can be called without authentication for pricing page
  const { PaymentPlanId } = await import('../payment/plans');
  
  return Object.values(PaymentPlanId)
    .filter(planId => planId !== PaymentPlanId.Credits) // Exclude one-time credits
    .map(planId => getPlanCreditInfo(planId));
};

/**
 * Admin operation to manually add credits to a user
 */
export const addCreditsToUser = async (
  { userId, amount, reason }: { userId: string; amount: number; reason: string },
  context: any
) => {
  // Add admin check here when you have admin roles
  if (!context.user) {
    throw new HttpError(401, 'User must be logged in');
  }

  // For now, only allow users to add credits to themselves
  // In production, add proper admin role checking
  if (context.user.id !== userId) {
    throw new HttpError(403, 'Not authorized to add credits to other users');
  }

  return await addCredits(userId, amount, reason, context);
};