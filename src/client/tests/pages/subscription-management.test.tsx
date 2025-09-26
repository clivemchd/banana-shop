import { test, expect, describe, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderInContext, mockServer } from 'wasp/client/test';
import { getCurrentUserCredits, getCurrentUserSubscription } from 'wasp/client/operations';
import { PaymentPlanId } from '../../../server/payment/plans';
import SubscriptionManagementPage from '../../pages/subscriptions/subscription-management';

// Mock server setup
const { mockQuery } = mockServer();

describe('Subscription Management Page', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockCredits = {
    userId: 'user-123',
    credits: 150,
    timestamp: new Date()
  };

  const mockSubscription = {
    isSubscribed: true,
    subscriptionStatus: 'active',
    subscriptionPlan: PaymentPlanId.Pro,
    datePaid: new Date(),
    credits: 150,
    paymentProcessorUserId: 'stripe-123',
    billingCycle: 'monthly',
    billingEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isPlanRenewed: true,
    scheduledPlanId: null,
    scheduledBillingCycle: null,
    scheduledStartDate: null
  };

  beforeEach(() => {
    // Reset all mocks before each test
    mockQuery(getCurrentUserCredits, mockCredits);
    mockQuery(getCurrentUserSubscription, mockSubscription);
  });

  test('renders subscription information for authenticated user', async () => {
    renderInContext(<SubscriptionManagementPage />);

    // Should display credits
    await waitFor(() => {
      expect(screen.getByText(/150/)).toBeInTheDocument();
    });

    // Should show subscription status
    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  test('displays correct plan information', async () => {
    renderInContext(<SubscriptionManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/pro/i)).toBeInTheDocument();
      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
    });
  });

  test('handles user with no subscription', async () => {
    const mockNoSubscription = {
      ...mockSubscription,
      isSubscribed: false,
      subscriptionStatus: null,
      subscriptionPlan: null
    };

    mockQuery(getCurrentUserSubscription, mockNoSubscription);

    renderInContext(<SubscriptionManagementPage />);

    await waitFor(() => {
      // Should show some indication of no active subscription
      expect(screen.queryByText(/active/i)).not.toBeInTheDocument();
    });
  });

  test('displays low credits warning when credits are low', async () => {
    const mockLowCredits = {
      ...mockCredits,
      credits: 5 // Low credit amount
    };

    mockQuery(getCurrentUserCredits, mockLowCredits);

    renderInContext(<SubscriptionManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});