import { test, expect, describe, beforeEach, vi } from 'vitest';
import { HttpError } from 'wasp/server';
import { 
  getCurrentUserCredits,
  checkUserCredits,
  consumeUserCredits,
  syncUserCredits,
  addCreditsToUser
} from '../../credits/credits-queries';

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

describe('Credits Queries Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    credits: 100,
    subscriptionStatus: 'active',
    subscriptionPlan: 'pro'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserCredits', () => {
    test('should return current user credits for authenticated user', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue(mockUser);

      const result = await getCurrentUserCredits({}, context);

      expect(result.userId).toBe(mockUserId);
      expect(result.credits).toBe(100);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('should throw HttpError when user is not authenticated', async () => {
      const context = createMockContext(); // No user

      await expect(getCurrentUserCredits({}, context))
        .rejects
        .toThrow(HttpError);
    });
  });

  describe('checkUserCredits', () => {
    test('should check if user has enough credits for an operation', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue(mockUser);

      const result = await checkUserCredits({ operation: 'IMAGE_GENERATION' }, context);

      expect(result.hasEnough).toBe(true);
      expect(result.required).toBe(0.5);
      expect(result.available).toBe(100);
    });

    test('should return false when user has insufficient credits', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0.2
      });

      const result = await checkUserCredits({ operation: 'IMAGE_GENERATION' }, context);

      expect(result.hasEnough).toBe(false);
      expect(result.required).toBe(0.5);
      expect(result.available).toBe(0.2);
    });

    test('should throw HttpError when user is not authenticated', async () => {
      const context = createMockContext(); // No user

      await expect(checkUserCredits({ operation: 'IMAGE_GENERATION' }, context))
        .rejects
        .toThrow(HttpError);
    });
  });

  describe('consumeUserCredits', () => {
    test('should successfully consume credits for authenticated user', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue(mockUser);
      context.entities.Users.update.mockResolvedValue({
        ...mockUser,
        credits: 99.5
      });

      const result = await consumeUserCredits({ operation: 'IMAGE_GENERATION' }, context);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(99.5);
      expect(result.creditCost).toBe(0.5);
    });

    test('should throw HttpError when user is not authenticated', async () => {
      const context = createMockContext(); // No user

      await expect(consumeUserCredits({ operation: 'IMAGE_GENERATION' }, context))
        .rejects
        .toThrow(HttpError);
    });
  });

  describe('syncUserCredits', () => {
    test('should sync credits for user with active subscription', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 50 // Less than plan allocation (180 for pro)
      });
      context.entities.Users.update.mockResolvedValue({
        ...mockUser,
        credits: 180
      });

      const result = await syncUserCredits({}, context);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(180);
      expect(result.planId).toBe('pro');
    });

    test('should skip sync for users without active subscription', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue({
        ...mockUser,
        subscriptionStatus: 'inactive',
        credits: 50
      });

      const result = await syncUserCredits({}, context);

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(50);
    });

    test('should throw HttpError when user is not authenticated', async () => {
      const context = createMockContext(); // No user

      await expect(syncUserCredits({}, context))
        .rejects
        .toThrow(HttpError);
    });
  });

  describe('addCreditsToUser', () => {
    test('should allow user to add credits to themselves', async () => {
      const context = createMockContext(mockUser);
      context.entities.Users.findUnique.mockResolvedValue(mockUser);
      context.entities.Users.update.mockResolvedValue({
        ...mockUser,
        credits: 150
      });

      const result = await addCreditsToUser({
        userId: mockUserId,
        amount: 50,
        reason: 'Test credit addition'
      }, context);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
    });

    test('should throw HttpError when user tries to add credits to another user', async () => {
      const context = createMockContext(mockUser);

      await expect(addCreditsToUser({
        userId: 'different-user-id',
        amount: 50,
        reason: 'Test'
      }, context))
        .rejects
        .toThrow(HttpError);
    });

    test('should throw HttpError when user is not authenticated', async () => {
      const context = createMockContext(); // No user

      await expect(addCreditsToUser({
        userId: mockUserId,
        amount: 50,
        reason: 'Test'
      }, context))
        .rejects
        .toThrow(HttpError);
    });
  });
});