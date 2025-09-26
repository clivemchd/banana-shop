import React, { useEffect, useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getCustomerPortalUrl, getCurrentUserSubscription, getLaunchSettings, generateCheckoutSession, syncUserCredits } from 'wasp/client/operations';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentPlans, PaymentPlanId } from '../../../server/payment/plans';
import Navbar from '../landing/navbar';
import { type BillingCycle } from '../../utils/pricing-calculations';

// Import new components
import CurrentSubscriptionCard from '../../components/subscription/current-subscription-card';
import PlanFeaturesCard from '../../components/subscription/plan-features-card';
import BillingManagementCard from '../../components/subscription/billing-management-card';
import PlanComparisonCard from '../../components/subscription/plan-comparison-card';
import SubscriptionAlerts from '../../components/subscription/subscription-alerts';
import DowngradeModal from '../../components/subscription/downgrade-modal';
import { getNextSubscriptionInfo, shouldShowNextSubscription } from '../../components/subscription/next-subscription-utils';

// User subscription info type matching the server operations
type UserSubscriptionInfo = {
    isSubscribed: boolean;
    subscriptionStatus: string | null;
    subscriptionPlan: PaymentPlanId | null;
    datePaid: Date | null;
    credits: number;
    paymentProcessorUserId: string | null;
    billingCycle: string | null;
    billingEndDate: Date | null;
    isPlanRenewed: boolean;
    scheduledPlanId: string | null;
    scheduledBillingCycle: string | null;
    scheduledStartDate: Date | null;
};

const SubscriptionManagementPage = () => {
    const { data: user } = useAuth();
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSyncingCredits, setIsSyncingCredits] = useState<boolean>(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [showDowngradeModal, setShowDowngradeModal] = useState<boolean>(false);
    const [pendingPlanId, setPendingPlanId] = useState<PaymentPlanId | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [showScheduledMessage, setShowScheduledMessage] = useState<boolean>(false);

    const {
        data: customerPortalUrl,
        isLoading: portalLoading,
        error: portalError
    } = useQuery(getCustomerPortalUrl);

    const {
        data: subscriptionData,
        isLoading: subscriptionLoading,
        error: subscriptionError
    } = useQuery(getCurrentUserSubscription);

    const {
        data: launchSettings,
        isLoading: launchLoading,
        error: launchError
    } = useQuery(getLaunchSettings);

    // Check for URL parameters (scheduled, success, canceled)
    useEffect(() => {
        const scheduled = searchParams.get('scheduled');
        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');

        if (scheduled === 'true') {
            setShowScheduledMessage(true);
            // Hide message after 10 seconds
            setTimeout(() => {
                setShowScheduledMessage(false);
            }, 10000);
        }

        // Remove all parameters from URL to prevent showing messages on refresh
        const newSearchParams = new URLSearchParams(searchParams);
        let shouldUpdate = false;

        if (scheduled) {
            newSearchParams.delete('scheduled');
            shouldUpdate = true;
        }
        if (success) {
            newSearchParams.delete('success');
            shouldUpdate = true;
        }
        if (canceled) {
            newSearchParams.delete('canceled');
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            setSearchParams(newSearchParams);
        }
    }, [searchParams, setSearchParams]);

    // Redirect to login if not authenticated
    if (!user) {
        navigate('/login');
        return null;
    }

    // Show loading state while subscription data is loading
    if (subscriptionLoading || launchLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center">
                            <div className="animate-pulse">Loading subscription data...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Use the subscription data from the query if available, otherwise fall back to user data
    const subscription: UserSubscriptionInfo | null = subscriptionData ? {
        isSubscribed: subscriptionData.isSubscribed,
        subscriptionStatus: subscriptionData.subscriptionStatus,
        subscriptionPlan: subscriptionData.subscriptionPlan as PaymentPlanId | null,
        datePaid: subscriptionData.datePaid,
        credits: subscriptionData.credits,
        paymentProcessorUserId: subscriptionData.paymentProcessorUserId,
        billingCycle: subscriptionData.billingCycle || null,
        billingEndDate: subscriptionData.billingEndDate || null,
        isPlanRenewed: subscriptionData.isPlanRenewed ?? true,
        scheduledPlanId: subscriptionData.scheduledPlanId || null,
        scheduledBillingCycle: subscriptionData.scheduledBillingCycle || null,
        scheduledStartDate: subscriptionData.scheduledStartDate || null,
    } : (user ? {
        isSubscribed: user.subscriptionStatus === 'active',
        subscriptionStatus: user.subscriptionStatus || null,
        subscriptionPlan: user.subscriptionPlan as PaymentPlanId | null,
        datePaid: user.datePaid || null,
        credits: user.credits || 0,
        paymentProcessorUserId: user.paymentProcessorUserId || null,
        billingCycle: user.billingCycle || null,
        billingEndDate: user.billingEndDate || null,
        isPlanRenewed: user.isPlanRenewed ?? true,
        scheduledPlanId: (user as any).scheduledPlanId || null,
        scheduledBillingCycle: (user as any).scheduledBillingCycle || null,
        scheduledStartDate: (user as any).scheduledStartDate || null,
    } : null);

    // Check if launch offer is active from server data
    const isLaunchActive = launchSettings?.isLaunchOfferActive || false;
    const discountPercent = launchSettings?.discountPercent || 0;

    // Handle subscription purchase or plan change
    const handleSubscribeClick = async (planId: PaymentPlanId) => {
        if (!user) {
            navigate('/signin');
            return;
        }

        // Check if this is a downgrade
        if (currentPlan && subscription?.isSubscribed) {
            const newPlanPrice = paymentPlans[planId as keyof typeof paymentPlans]?.price || 0;
            const currentPrice = currentPlan.price;

            if (newPlanPrice < currentPrice) {
                // Show confirmation modal for downgrades
                setPendingPlanId(planId);
                setShowDowngradeModal(true);
                return;
            }
        }

        // Proceed with plan change
        await processPlanChange(planId);
    };

    const processPlanChange = async (planId: PaymentPlanId) => {
        try {
            setIsPaymentLoading(true);
            setErrorMessage(null);

            // Check if user has existing subscription
            const isUpgradeOrSwitch = Boolean(subscription?.isSubscribed && currentPlan);

            const { sessionUrl } = await generateCheckoutSession({
                paymentPlanId: planId,
                billingCycle: billingCycle,
                // Add parameter to indicate this is a plan change (will be handled by backend)
                isSubscriptionChange: isUpgradeOrSwitch
            });

            if (sessionUrl) {
                window.location.href = sessionUrl;
            }
        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            setErrorMessage(error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const currentPlan = subscription?.subscriptionPlan
        ? paymentPlans[subscription.subscriptionPlan as keyof typeof paymentPlans]
        : null;

    // Get billing cycle from stored database value - always use database as source of truth
    const getCurrentBillingCycle = (): BillingCycle => {
        if (!subscription?.billingCycle) return 'monthly';

        // Normalize the stored billing cycle to match our BillingCycle type
        return subscription.billingCycle === 'annual' ? 'annual' : 'monthly';
    };

    const currentBillingCycle = getCurrentBillingCycle();

    const handleManageBilling = () => {
        if (customerPortalUrl) {
            window.location.href = customerPortalUrl;
        }
    };

    const handleDowngradeConfirm = async () => {
        setShowDowngradeModal(false);
        if (pendingPlanId) {
            await processPlanChange(pendingPlanId);
        }
        setPendingPlanId(null);
    };

    const handleDowngradeCancel = () => {
        setShowDowngradeModal(false);
        setPendingPlanId(null);
    };

    const handleSyncCredits = async () => {
        setIsSyncingCredits(true);
        setSyncMessage(null);

        try {
            const result = await syncUserCredits();

            if (result.success) {
                setSyncMessage(`✅ Credits synced! New balance: ${result.newBalance} credits`);
                // Refresh the page data to show updated credits
                window.location.reload();
            } else {
                setSyncMessage(`ℹ️ Credits already synced. Current balance: ${result.newBalance} credits`);
            }
        } catch (error: any) {
            console.error('Error syncing credits:', error);
            setSyncMessage(`❌ Failed to sync credits: ${error.message}`);
        } finally {
            setIsSyncingCredits(false);
        }
    };

    // Get next subscription info
    const nextSubscriptionInfo = getNextSubscriptionInfo(subscription);
    const showNextSubscription = shouldShowNextSubscription(subscription);

    // Mock next subscription data for demonstration (replace with actual logic)
    const nextSubscription: UserSubscriptionInfo | null = nextSubscriptionInfo ? {
        ...subscription!,
        subscriptionPlan: nextSubscriptionInfo.subscriptionPlan,
        billingCycle: nextSubscriptionInfo.billingCycle,
        datePaid: nextSubscriptionInfo.scheduledStartDate,
        subscriptionStatus: 'scheduled'
    } : null;

    const nextPlan = nextSubscription?.subscriptionPlan
        ? paymentPlans[nextSubscription.subscriptionPlan as keyof typeof paymentPlans]
        : null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your subscription and billing preferences</p>
                </div>

                {/* Subscription Alerts */}
                <SubscriptionAlerts 
                    showScheduledMessage={showScheduledMessage}
                    subscription={subscription}
                />

                {/* Current Subscription Overview */}
                <CurrentSubscriptionCard
                    subscription={subscription}
                    currentPlan={currentPlan}
                    currentBillingCycle={currentBillingCycle}
                    isLaunchActive={isLaunchActive}
                    discountPercent={discountPercent}
                    isSyncingCredits={isSyncingCredits}
                    syncMessage={syncMessage}
                    onSyncCredits={handleSyncCredits}
                />

                {/* Next Subscription Card - Only show if there's a scheduled change */}
                {showNextSubscription && nextSubscription && nextPlan && (
                    <CurrentSubscriptionCard
                        subscription={nextSubscription}
                        currentPlan={nextPlan}
                        currentBillingCycle={nextSubscription.billingCycle === 'annual' ? 'annual' : 'monthly'}
                        isLaunchActive={isLaunchActive}
                        discountPercent={discountPercent}
                        isSyncingCredits={false}
                        syncMessage={null}
                        onSyncCredits={() => {}}
                        cardTitle="Next Subscription"
                        cardDescription="Your scheduled plan change that will take effect soon"
                        isUpcoming={true}
                    />
                )}

                {/* Plan Features & Billing Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Plan Features Card */}
                    <PlanFeaturesCard
                        subscription={subscription}
                        currentPlan={currentPlan}
                        isSyncingCredits={isSyncingCredits}
                        syncMessage={syncMessage}
                        onSyncCredits={handleSyncCredits}
                    />

                    {/* Billing Management Card */}
                    <BillingManagementCard
                        subscription={subscription}
                        customerPortalUrl={customerPortalUrl || null}
                        portalLoading={portalLoading}
                        portalError={portalError}
                        onManageBilling={handleManageBilling}
                        isFullWidth={!subscription?.isSubscribed || !currentPlan}
                    />
                </div>

                {/* Pricing Plans Comparison */}
                <PlanComparisonCard
                    subscription={subscription}
                    billingCycle={billingCycle}
                    setBillingCycle={setBillingCycle}
                    isLaunchActive={isLaunchActive}
                    discountPercent={discountPercent}
                    isPaymentLoading={isPaymentLoading}
                    errorMessage={errorMessage}
                    onSubscribeClick={handleSubscribeClick}
                />
            </div>

            {/* Downgrade Confirmation Modal */}
            <DowngradeModal
                showDowngradeModal={showDowngradeModal}
                setShowDowngradeModal={setShowDowngradeModal}
                pendingPlanId={pendingPlanId}
                currentPlan={currentPlan}
                subscription={subscription}
                isPaymentLoading={isPaymentLoading}
                onConfirm={handleDowngradeConfirm}
                onCancel={handleDowngradeCancel}
            />
        </div>
    );
};

export default SubscriptionManagementPage;