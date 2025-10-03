import { HttpError } from 'wasp/server';
import { hasEnoughCredits, deductCredits, type CreditOperation } from './credits-operations';

export interface CreditGuardResult {
  success: boolean;
  newBalance?: number;
  creditCost?: number;
}

/**
 * Guard function that validates subscription, checks credits, and deducts them
 * This should be called at the start of any operation that requires credits
 * 
 * @param userId - The user ID
 * @param operation - The type of operation (IMAGE_GENERATION, IMAGE_EDIT, etc.)
 * @param context - The Wasp context object
 * @param skipDeduction - If true, only validates but doesn't deduct credits (for blending operations)
 * @returns CreditGuardResult with success status and new balance
 * @throws HttpError if validation fails
 */
export const validateAndDeductCredits = async (
  userId: string,
  operation: CreditOperation,
  context: any,
  skipDeduction = false
): Promise<CreditGuardResult> => {
  // Step 1: Check if user exists
  const user = await context.entities.Users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Step 2: Check if user has active subscription
  if (!user.subscriptionStatus || user.subscriptionStatus !== 'active') {
    throw new HttpError(403, 'Active subscription required. Please subscribe to use this feature.');
  }

  // Step 3: Check if user has enough credits
  const creditCheck = await hasEnoughCredits(userId, operation, context);
  
  if (!creditCheck.hasEnough) {
    throw new HttpError(
      402, 
      `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}. Please upgrade your plan or wait for your credits to renew.`
    );
  }

  // Step 4: Deduct credits if not skipped
  if (!skipDeduction) {
    const deductionResult = await deductCredits(userId, operation, context);
    return {
      success: true,
      newBalance: deductionResult.newBalance,
      creditCost: deductionResult.creditCost
    };
  }

  return {
    success: true,
    newBalance: creditCheck.available,
    creditCost: 0
  };
};

/**
 * Validates subscription and credits without deducting
 * Useful for pre-flight checks on the client side
 */
export const validateCreditsOnly = async (
  userId: string,
  operation: CreditOperation,
  context: any
): Promise<{ isValid: boolean; required: number; available: number }> => {
  const user = await context.entities.Users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (!user.subscriptionStatus || user.subscriptionStatus !== 'active') {
    return {
      isValid: false,
      required: 0,
      available: 0
    };
  }

  const creditCheck = await hasEnoughCredits(userId, operation, context);
  
  return {
    isValid: creditCheck.hasEnough,
    required: creditCheck.required,
    available: creditCheck.available
  };
};
