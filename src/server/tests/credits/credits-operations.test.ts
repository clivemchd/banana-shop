import { test, expect, describe, beforeEach, vi } from 'vitest';
import { HttpError } from 'wasp/server';
import { 
  CREDIT_COSTS, 
  PLAN_CREDIT_ALLOCATION,
  getUserCredits,
  hasEnoughCredits,
  deductCredits,
  addCredits,
  getPlanCreditInfo
} from '../../credits/credits-operations';
import { PaymentPlanId } from '../../payment/plans';

// Mock context for testing
const createMockContext = (user?: any) => ({
  user,
  entities: {
    Users: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn()
    }
  }
});

describe('Credits Operations', () => {
  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    credits: 100,
    subscriptionPlan: PaymentPlanId.Pro
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CREDIT_COSTS constant', () => {
    test('should have correct credit costs for operations', () => {
      expect(CREDIT_COSTS.IMAGE_GENERATION).toBe(0.5);
      expect(CREDIT_COSTS.IMAGE_EDIT).toBe(1);
      expect(CREDIT_COSTS.IMAGE_UPSCALE).toBe(1.5);
    });
  });

  describe('PLAN_CREDIT_ALLOCATION constant', () => {
    test('should have correct credit allocation for each plan', () => {
      expect(PLAN_CREDIT_ALLOCATION[PaymentPlanId.Starter]).toBe(40);
      expect(PLAN_CREDIT_ALLOCATION[PaymentPlanId.Pro]).toBe(180);
      expect(PLAN_CREDIT_ALLOCATION[PaymentPlanId.Business]).toBe(1000);
      expect(PLAN_CREDIT_ALLOCATION[PaymentPlanId.Credits]).toBe(50);
    });
  });

  describe('getUserCredits', () => {
    test('should return user credits when user exists', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue(mockUser);

      const credits = await getUserCredits(mockUserId, context);

      expect(credits).toBe(100);
      expect(context.entities.Users.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { credits: true }
      });
    });

    test('should return 0 when user credits is null', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue({ 
        ...mockUser, 
        credits: null 
      });

      const credits = await getUserCredits(mockUserId, context);

      expect(credits).toBe(0);
    });

    test('should throw error when user not found', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue(null);

      await expect(getUserCredits(mockUserId, context))
        .rejects
        .toThrow(HttpError);
    });
  });

  describe('hasEnoughCredits', () => {
    test('should return true when user has enough credits', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue(mockUser);

      const result = await hasEnoughCredits(mockUserId, 'IMAGE_GENERATION', context);

      expect(result.hasEnough).toBe(true);
      expect(result.required).toBe(0.5);
      expect(result.available).toBe(100);
    });

    test('should return false when user does not have enough credits', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0.2 // Less than required 0.5
      });

      const result = await hasEnoughCredits(mockUserId, 'IMAGE_GENERATION', context);

      expect(result.hasEnough).toBe(false);
      expect(result.required).toBe(0.5);
      expect(result.available).toBe(0.2);
    });
  });

  describe('deductCredits', () => {
    test('should successfully deduct credits when user has enough', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue(mockUser);
      context.entities.Users.update.mockResolvedValue({
        ...mockUser,
        credits: 99.5
      });

      const result = await deductCredits(mockUserId, 'IMAGE_GENERATION', context);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(99.5);
      expect(result.creditCost).toBe(0.5);
      expect(context.entities.Users.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { credits: 99.5 }
      });
    });

    test('should throw error when user does not have enough credits', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0.2
      });

      await expect(deductCredits(mockUserId, 'IMAGE_GENERATION', context))
        .rejects
        .toThrow(HttpError);
    });
  });

  describe('addCredits', () => {
    test('should successfully add credits to user', async () => {
      const context = createMockContext();
      context.entities.Users.findUnique.mockResolvedValue(mockUser);
      context.entities.Users.update.mockResolvedValue({
        ...mockUser,
        credits: 150
      });

      const result = await addCredits(mockUserId, 50, 'Test credit addition', context);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
      expect(context.entities.Users.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { credits: 150 }
      });
    });

    test('should throw error when adding negative credits', async () => {
      const context = createMockContext();

      await expect(addCredits(mockUserId, -10, 'Invalid addition', context))
        .rejects
        .toThrow('Cannot add negative credits');
    });
  });

  describe('getPlanCreditInfo', () => {
    test('should return correct plan credit information', () => {
      const planInfo = getPlanCreditInfo(PaymentPlanId.Pro);

      expect(planInfo.planId).toBe(PaymentPlanId.Pro);
      expect(planInfo.credits).toBe(180);
      expect(planInfo.estimatedGenerations).toBe(360); // 180 / 0.5
      expect(planInfo.estimatedEdits).toBe(180); // 180 / 1
    });

    test('should handle all plan types', () => {
      const starterInfo = getPlanCreditInfo(PaymentPlanId.Starter);
      const businessInfo = getPlanCreditInfo(PaymentPlanId.Business);
      const creditsInfo = getPlanCreditInfo(PaymentPlanId.Credits);

      expect(starterInfo.planId).toBe(PaymentPlanId.Starter);
      expect(businessInfo.planId).toBe(PaymentPlanId.Business);
      expect(creditsInfo.planId).toBe(PaymentPlanId.Credits);

      expect(starterInfo.credits).toBe(40);
      expect(businessInfo.credits).toBe(1000);
      expect(creditsInfo.credits).toBe(50);
    });
  });
});