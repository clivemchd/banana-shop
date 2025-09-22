import type { Users } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { paymentPlans, PaymentPlanId } from '../payment/plans';

// Define credit allocation per plan (per billing cycle)
export const PLAN_CREDIT_ALLOCATION: Record<PaymentPlanId, number> = {
  [PaymentPlanId.Starter]: 40,    // 40 credits = 80 generations (0.5 credit per generation)
  [PaymentPlanId.Pro]: 180,       // 180 credits = 360 generations  
  [PaymentPlanId.Business]: 1000, // 1000 credits = 2000 generations
  [PaymentPlanId.Credits]: 50,    // One-time credit purchase
};

// Credit costs for different operations
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 0.5,    // 0.5 credits per image generation
  IMAGE_EDIT: 1,           // 1 credit per image edit
  IMAGE_UPSCALE: 1.5,      // 1.5 credits per upscale
  IMAGE_VARIATION: 0.5,    // 0.5 credits per variation
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;

/**
 * Get user's current credit balance
 */
export const getUserCredits = async (userId: string, context: any): Promise<number> => {
  const user = await context.entities.Users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user.credits || 0;
};

/**
 * Add credits to user account
 */
export const addCredits = async (
  userId: string, 
  amount: number, 
  reason: string,
  context: any
): Promise<{ success: boolean; newBalance: number }> => {
  if (amount <= 0) {
    throw new HttpError(400, 'Credit amount must be positive');
  }

  const user = await context.entities.Users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const currentCredits = user.credits || 0;
  const newBalance = currentCredits + amount;

  await context.entities.Users.update({
    where: { id: userId },
    data: { credits: newBalance }
  });

  // Log the credit transaction (you could create a separate CreditTransactions table)
  console.log(`💳 Credits added - User: ${userId}, Amount: +${amount}, Reason: ${reason}, Balance: ${newBalance}`);

  return {
    success: true,
    newBalance
  };
};

/**
 * Deduct credits from user account
 */
export const deductCredits = async (
  userId: string,
  operation: CreditOperation,
  context: any
): Promise<{ success: boolean; newBalance: number; creditCost: number }> => {
  const creditCost = CREDIT_COSTS[operation];
  
  const user = await context.entities.Users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const currentCredits = user.credits || 0;

  if (currentCredits < creditCost) {
    throw new HttpError(402, `Insufficient credits. Required: ${creditCost}, Available: ${currentCredits}`);
  }

  const newBalance = currentCredits - creditCost;

  await context.entities.Users.update({
    where: { id: userId },
    data: { credits: newBalance }
  });

  // Log the credit transaction
  console.log(`💳 Credits deducted - User: ${userId}, Operation: ${operation}, Cost: -${creditCost}, Balance: ${newBalance}`);

  return {
    success: true,
    newBalance,
    creditCost
  };
};

/**
 * Check if user has enough credits for an operation
 */
export const hasEnoughCredits = async (
  userId: string,
  operation: CreditOperation,
  context: any
): Promise<{ hasEnough: boolean; required: number; available: number }> => {
  const required = CREDIT_COSTS[operation];
  const available = await getUserCredits(userId, context);

  return {
    hasEnough: available >= required,
    required,
    available
  };
};

/**
 * Sync user credits based on their active subscription plan
 * This should be called when subscription changes or periodically
 */
export const syncCreditsWithSubscription = async (
  userId: string,
  context: any
): Promise<{ success: boolean; newBalance: number; planId?: PaymentPlanId }> => {
  const user = await context.entities.Users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Only sync if user has an active subscription
  if (user.subscriptionStatus !== 'active' || !user.subscriptionPlan) {
    console.log(`⚠️ Credits sync skipped - User ${userId} has no active subscription`);
    return {
      success: false,
      newBalance: user.credits || 0
    };
  }

  const planId = user.subscriptionPlan as PaymentPlanId;
  const planCredits = PLAN_CREDIT_ALLOCATION[planId];

  if (planCredits === undefined) {
    throw new HttpError(400, `Unknown subscription plan: ${planId}`);
  }

  // Check if user already has the correct credits for this billing cycle
  // For now, we'll set to plan amount if they have less than plan amount
  // In a production system, you'd want to track billing cycles and reset monthly
  const currentCredits = user.credits || 0;
  
  if (currentCredits < planCredits) {
    const newBalance = planCredits;
    
    await context.entities.Users.update({
      where: { id: userId },
      data: { credits: newBalance }
    });

    console.log(`🔄 Credits synced - User: ${userId}, Plan: ${planId}, Credits set to: ${newBalance}`);

    return {
      success: true,
      newBalance,
      planId
    };
  }

  console.log(`✅ Credits already synced - User: ${userId}, Plan: ${planId}, Current: ${currentCredits}`);
  
  return {
    success: true,
    newBalance: currentCredits,
    planId
  };
};

/**
 * Reset credits to plan allocation (for billing cycle renewal)
 */
export const resetCreditsForBillingCycle = async (
  userId: string,
  context: any
): Promise<{ success: boolean; newBalance: number; planId?: PaymentPlanId }> => {
  const user = await context.entities.Users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Only reset if user has an active subscription
  if (user.subscriptionStatus !== 'active' || !user.subscriptionPlan) {
    return {
      success: false,
      newBalance: user.credits || 0
    };
  }

  const planId = user.subscriptionPlan as PaymentPlanId;
  const planCredits = PLAN_CREDIT_ALLOCATION[planId];

  if (planCredits === undefined) {
    throw new HttpError(400, `Unknown subscription plan: ${planId}`);
  }

  await context.entities.Users.update({
    where: { id: userId },
    data: { credits: planCredits }
  });

  console.log(`🔄 Credits reset for billing cycle - User: ${userId}, Plan: ${planId}, New balance: ${planCredits}`);

  return {
    success: true,
    newBalance: planCredits,
    planId
  };
};

/**
 * Get credit information for a specific plan
 */
export const getPlanCreditInfo = (planId: PaymentPlanId) => {
  const credits = PLAN_CREDIT_ALLOCATION[planId];
  const plan = paymentPlans[planId];
  
  return {
    planId,
    planName: plan.name,
    credits,
    estimatedGenerations: Math.floor(credits / CREDIT_COSTS.IMAGE_GENERATION),
    estimatedEdits: Math.floor(credits / CREDIT_COSTS.IMAGE_EDIT),
  };
};