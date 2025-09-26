import { test, expect, describe, beforeEach, vi } from 'vitest';
import { HttpError } from 'wasp/server';
import { getCurrentUserSubscription } from '../../../user/user-operations';

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

describe('User Operations Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    subscriptionStatus: 'active',
    subscriptionPlan: 'pro',
    datePaid: new Date(),
    credits: 150,
    paymentProcessorUserId: 'stripe-123',
    billingCycle: 'monthly',
    billingEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isPlanRenewed: true,
    scheduledPlanId: null,
    scheduledBillingCycle: null,
    scheduledStartDate: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserSubscription', () => {
    test('should return subscription info for authenticated user', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue(mockUser);

      const result = await getCurrentUserSubscription({}, context);

      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptionStatus).toBe('active');
      expect(result.subscriptionPlan).toBe('pro');
      expect(result.credits).toBe(150);
      expect(result.billingCycle).toBe('monthly');
      expect(result.isPlanRenewed).toBe(true);
    });

    test('should return non-subscribed info for user without subscription', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        subscriptionStatus: null,
        subscriptionPlan: null
      });

      const result = await getCurrentUserSubscription({}, context);

      expect(result.isSubscribed).toBe(false);
      expect(result.subscriptionStatus).toBe(null);
      expect(result.subscriptionPlan).toBe(null);
    });

    test('should throw HttpError when user is not authenticated', async () => {
      const context = createMockContext(); // No user

      await expect(getCurrentUserSubscription({}, context))
        .rejects
        .toThrow(HttpError);
    });

    test('should handle scheduled plan changes', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        scheduledPlanId: 'business',
        scheduledBillingCycle: 'annual',
        scheduledStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });

      const result = await getCurrentUserSubscription({}, context);

      expect(result.scheduledPlanId).toBe('business');
      expect(result.scheduledBillingCycle).toBe('annual');
      expect(result.scheduledStartDate).toBeInstanceOf(Date);
    });

    test('should handle user with zero credits', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0
      });

      const result = await getCurrentUserSubscription({}, context);

      expect(result.credits).toBe(0);
      expect(result.isSubscribed).toBe(true); // Still subscribed, just no credits
    });
  });
});