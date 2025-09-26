import React, { useEffect, useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getCustomerPortalUrl, getCurrentUserSubscription, getLaunchSettings, generateCheckoutSession, syncUserCredits } from 'wasp/client/operations';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentPlans, PaymentPlanId, getSubscriptionPaymentPlanIds } from '../../../server/payment/plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CreditCard, Calendar, Crown, Settings, ExternalLink, Check, X, RefreshCw, AlertTriangle } from 'lucide-react';
import Navbar from '../landing/navbar';
import {
    getUnifiedPlans,
    calculatePlanPricing,
    calculateAnnualSavings,
    getMaxAnnualSavingsPercent,
    formatPrice,
    type BillingCycle,
    type PlanPricing
} from '../../utils/pricing-calculations';

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
    } : null);

    // Check if launch offer is active from server data
    const isLaunchActive = launchSettings?.isLaunchOfferActive || false;
    const discountPercent = launchSettings?.discountPercent || 0;

    // Calculate maximum annual savings for the badge using shared utility
    const maxAnnualSavings = getMaxAnnualSavingsPercent();

    // Get unified plans
    const unifiedPlans = getUnifiedPlans();



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

    // Get unified plan data for consistent pricing calculations
    const currentUnifiedPlan = currentPlan && subscription?.subscriptionPlan
        ? unifiedPlans.find(p => p.planId === subscription.subscriptionPlan)
        : null;

    // Debug: Log the values to help troubleshoot
    if (currentPlan && subscription?.subscriptionPlan && !currentUnifiedPlan) {
        console.log('DEBUG: Could not find unified plan', {
            subscriptionPlan: subscription.subscriptionPlan,
            availableUnifiedPlans: unifiedPlans.map(p => p.planId),
            currentBillingCycle: getCurrentBillingCycle()
        });
    }

    // Debug: Log subscription data to troubleshoot billing cycle and end date
    if (subscription) {
        console.log('DEBUG: Subscription data', {
            billingCycle: subscription.billingCycle,
            billingEndDate: subscription.billingEndDate,
            datePaid: subscription.datePaid,
            subscriptionStatus: subscription.subscriptionStatus,
            isPlanRenewed: subscription.isPlanRenewed,
            calculatedBillingCycle: getCurrentBillingCycle()
        });
    }

    const currentBillingCycle = getCurrentBillingCycle();

    const getSubscriptionStatusBadge = () => {
        if (!subscription?.subscriptionStatus) {
            return <Badge variant="secondary">No Active Subscription</Badge>;
        }

        const statusVariants = {
            active: 'default' as const,
            canceled: 'destructive' as const,
            incomplete: 'secondary' as const,
            incomplete_expired: 'destructive' as const,
            trialing: 'secondary' as const,
            past_due: 'destructive' as const,
            unpaid: 'destructive' as const,
        };

        const variant = statusVariants[subscription.subscriptionStatus as keyof typeof statusVariants] || 'secondary';

        return (
            <Badge variant={variant} className="capitalize">
                {subscription.subscriptionStatus.replace('_', ' ')}
            </Badge>
        );
    };

    const handleManageBilling = () => {
        if (customerPortalUrl) {
            window.location.href = customerPortalUrl;
        }
    };

    // Helper function to get button text and variant for each plan
    const getButtonConfig = (plan: any) => {
        if (!subscription?.isSubscribed) {
            return { text: 'Start Subscription', variant: 'default' as const, disabled: false };
        }

        if (subscription.subscriptionPlan === plan.planId) {
            return { text: 'Current Plan', variant: 'outline' as const, disabled: true };
        }

        if (currentPlan) {
            // Get the plan price from paymentPlans for comparison
            const planPrice = paymentPlans[plan.planId as keyof typeof paymentPlans]?.price || 0;
            const currentPrice = currentPlan.price;

            const isUpgrade = planPrice > currentPrice;
            const isDowngrade = planPrice < currentPrice;

            if (isUpgrade) {
                return { text: 'Upgrade Now', variant: 'default' as const, disabled: false };
            } else if (isDowngrade) {
                return { text: 'Downgrade Plan', variant: 'secondary' as const, disabled: false };
            }
        }

        return { text: 'Start Subscription', variant: 'default' as const, disabled: false };
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

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your subscription and billing preferences</p>
                </div>

                {/* Scheduled Subscription Change Alert */}
                {showScheduledMessage && (
                    <Alert className="mb-8 border-green-200 bg-green-50">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            <strong>Subscription Change Scheduled!</strong> Your new plan will start when your current billing cycle ends.
                            You can continue using your current plan until then.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Plan Cancellation Alert */}
                {subscription?.subscriptionStatus === 'active' && subscription?.isPlanRenewed === false && (
                    <Alert className="mb-8 border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                            <strong>Subscription Cancelled</strong> - Your subscription will end on{' '}
                            {subscription.billingEndDate
                                ? new Date(subscription.billingEndDate).toLocaleDateString()
                                : 'your next billing date'
                            }. You'll continue to have access to all features until then.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Current Subscription Overview */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Crown className="h-5 w-5" />
                                    Current Subscription
                                </CardTitle>
                                <CardDescription>
                                    Your active plan and billing information
                                </CardDescription>
                            </div>
                            {subscription?.subscriptionStatus === 'active' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSyncCredits}
                                    disabled={isSyncingCredits}
                                    className="h-8 px-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isSyncingCredits ? 'animate-spin' : ''}`} />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            {/* Plan Info - Only show if user has a subscription */}
                            {currentPlan && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Plan</p>
                                    <p className="text-2xl font-semibold align-middle">
                                        {currentPlan.name}{' '} 
                                        <Badge className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                            {discountPercent}% OFF
                                        </Badge>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {isLaunchActive ? (
                                            <>
                                                <p className="text-muted-foreground">
                                                    {currentUnifiedPlan
                                                        ? (() => {
                                                            const pricing = calculatePlanPricing(currentUnifiedPlan, currentBillingCycle, true, discountPercent);
                                                            // For annual billing, show the full annual price (multiply monthly by 12)
                                                            const displayAmount = currentBillingCycle === 'annual'
                                                                ? pricing.displayPrice * 12
                                                                : pricing.displayPrice;
                                                            return `$${formatPrice(displayAmount)}/${currentBillingCycle === 'annual' ? 'year' : 'month'}`;
                                                        })()
                                                        : currentBillingCycle === 'annual'
                                                            ? `$${formatPrice(currentPlan.price * 12 * (1 - discountPercent / 100))}/year`
                                                            : `$${formatPrice(currentPlan.price * (1 - discountPercent / 100))}/month`
                                                    }
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                {currentUnifiedPlan
                                                    ? (() => {
                                                        const pricing = calculatePlanPricing(currentUnifiedPlan, currentBillingCycle, false);
                                                        // For annual billing, show the full annual price (multiply monthly by 12)
                                                        const displayAmount = currentBillingCycle === 'annual'
                                                            ? pricing.displayPrice * 12
                                                            : pricing.displayPrice;
                                                        return `$${formatPrice(displayAmount)}/${currentBillingCycle === 'annual' ? 'year' : 'month'}`;
                                                    })()
                                                    : currentBillingCycle === 'annual'
                                                        ? `$${formatPrice(currentPlan.price * 12)}/year`
                                                        : `$${formatPrice(currentPlan.price)}/month`
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="space-y-1">
                                    {getSubscriptionStatusBadge()}
                                </div>
                            </div>

                            {/* Credits Available */}
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Credits Available</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <p className="text-lg font-semibold">{subscription?.credits || 0}</p>
                                </div>
                                {syncMessage && (
                                    <p className="text-xs text-muted-foreground">{syncMessage}</p>
                                )}
                            </div>

                            {/* Last Payment */}
                            {subscription?.datePaid && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Last Payment</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p>{new Date(subscription.datePaid).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}

                            {/* Next Billing Date / Ends On Date */}
                            {subscription?.datePaid && subscription?.subscriptionStatus === 'active' && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        {subscription.isPlanRenewed === false ? 'Ends On' : 'Next Billing'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p>
                                            {(() => {
                                                // Use stored billingEndDate if available, otherwise calculate from last payment
                                                if (subscription.billingEndDate) {
                                                    return new Date(subscription.billingEndDate).toLocaleDateString();
                                                }

                                                // Fallback to calculation based on last payment and billing cycle
                                                const lastPayment = new Date(subscription.datePaid);
                                                const nextBilling = new Date(lastPayment);
                                                nextBilling.setMonth(nextBilling.getMonth() + (currentBillingCycle === 'annual' ? 12 : 1));
                                                return nextBilling.toLocaleDateString();
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Auto Renew Status */}
                            {subscription?.subscriptionStatus === 'active' && subscription.isPlanRenewed === false && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Auto Renew</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive" className="text-xs">
                                            Cancelled
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Features & Billing Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Plan Features - Only show if user has an active subscription */}
                    {subscription?.isSubscribed && currentPlan && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Check className="h-5 w-5" />
                                    Plan Features
                                </CardTitle>
                                <CardDescription>
                                    What's included in your {currentPlan.name} plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {currentPlan?.features ? (
                                    <ul className="space-y-3">
                                        {currentPlan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No features available</p>
                                )}

                                {/* Credits Information */}
                                <div className="mt-6 p-3 bg-accent/50 rounded-lg">
                                    <h4 className="text-sm font-medium mb-2">Credit Usage</h4>
                                    <div className="text-xs space-y-1 text-muted-foreground">
                                        <p><strong>Current Balance:</strong> {subscription?.credits || 0} credits</p>
                                        <p><strong>Image Generation:</strong> 0.5 credits each</p>
                                        <p><strong>Image Editing:</strong> 1 credit each</p>
                                        <p>Credits refresh with each billing cycle</p>
                                    </div>

                                    <Button
                                        onClick={handleSyncCredits}
                                        disabled={isSyncingCredits}
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingCredits ? 'animate-spin' : ''}`} />
                                        {isSyncingCredits ? 'Syncing...' : 'Sync Credits'}
                                    </Button>

                                    {syncMessage && (
                                        <div className="mt-2 p-2 bg-background rounded text-xs">
                                            {syncMessage}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Billing Management - Full width when no subscription */}
                    <Card className={!subscription?.isSubscribed || !currentPlan ? "lg:col-span-2" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Billing Management
                            </CardTitle>
                            <CardDescription>
                                Manage your payment methods and billing preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                onClick={handleManageBilling}
                                disabled={portalLoading || !customerPortalUrl || subscription?.subscriptionStatus === 'canceled'}
                                className="w-full"
                                variant="outline"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {portalLoading ? 'Loading...' : subscription?.subscriptionStatus === 'canceled' ? 'Billing Unavailable' : 'Open Billing Portal'}
                            </Button>

                            {portalError && subscription?.subscriptionStatus !== 'canceled' && (
                                <p className="text-sm text-destructive">
                                    Error loading billing portal. Please try again.
                                </p>
                            )}

                            <div className="text-xs text-muted-foreground">
                                {subscription?.subscriptionStatus === 'canceled'
                                    ? 'Billing portal is not available for cancelled subscriptions.'
                                    : 'Opens Stripe Customer Portal in a new window to manage payment methods, invoices, and subscription settings.'
                                }
                            </div>
                        </CardContent>
                    </Card>
                </div>        {/* Pricing Plans Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Compare Plans
                        </CardTitle>
                        <CardDescription>
                            Choose the perfect plan for your needs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Billing Cycle Toggle */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div></div> {/* Empty cell to align with feature column */}
                            <div className="md:col-span-3 flex justify-center">
                                <div className="bg-muted p-1 rounded-lg flex">
                                    <Button
                                        variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setBillingCycle('monthly')}
                                        className="px-4 py-2"
                                    >
                                        Monthly
                                    </Button>
                                    <Button
                                        variant={billingCycle === 'annual' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setBillingCycle('annual')}
                                        className="px-4 py-2"
                                    >
                                        Annual
                                        {maxAnnualSavings > 0 && (
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                Save up to {maxAnnualSavings}%
                                            </Badge>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Plan Headers */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div></div> {/* Empty cell for feature column */}
                            {unifiedPlans.map((plan) => {
                                const isCurrentPlan = subscription?.subscriptionPlan === plan.planId;

                                return (
                                    <Card key={plan.planId} className={`text-center relative ${isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''}`}>
                                        <CardHeader className="pb-2">
                                            {isCurrentPlan && (
                                                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" variant="default">
                                                    Current
                                                </Badge>
                                            )}
                                            {plan.isPopular && !isCurrentPlan && (
                                                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                                                    Popular
                                                </Badge>
                                            )}
                                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                                            <div className="space-y-1">
                                                {(() => {
                                                    const pricing = calculatePlanPricing(plan, billingCycle, isLaunchActive, discountPercent);
                                                    const annualSavings = calculateAnnualSavings(plan, isLaunchActive, discountPercent);

                                                    return (
                                                        <>
                                                            {pricing.isDiscounted ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <p className="text-2xl font-bold">${formatPrice(pricing.displayPrice)}</p>
                                                                    <p className="text-lg text-muted-foreground line-through">${formatPrice(pricing.originalPrice)}</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-3xl font-bold">${formatPrice(pricing.displayPrice)}</p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground">
                                                                per month{billingCycle === 'annual' ? ' (billed annually)' : ''}
                                                            </p>
                                                            {billingCycle === 'annual' && annualSavings && annualSavings > 0 && (
                                                                <div className="text-xs text-green-600">
                                                                    Save ${formatPrice(annualSavings)} vs monthly
                                                                </div>
                                                            )}
                                                            {isLaunchActive && (
                                                                <Badge className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                                                    {discountPercent}% OFF
                                                                </Badge>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            {(() => {
                                                const buttonConfig = getButtonConfig(plan);
                                                return (
                                                    <Button
                                                        onClick={() => handleSubscribeClick(plan.planId)}
                                                        disabled={isPaymentLoading || buttonConfig.disabled}
                                                        variant={buttonConfig.variant}
                                                        className="w-full"
                                                    >
                                                        {isPaymentLoading ? 'Processing...' : buttonConfig.text}
                                                    </Button>
                                                );
                                            })()}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
                                <p className="text-red-700 text-sm">{errorMessage}</p>
                            </div>
                        )}

                        {/* Launch Offer Banner */}
                        {isLaunchActive && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white text-center">
                                <p className="text-lg font-semibold">🚀 Launch Special: {discountPercent}% OFF All Plans!</p>
                                <p className="text-sm opacity-90">Limited time offer - Get started with AI image generation at discounted prices</p>
                            </div>
                        )}

                        {/* Features Comparison Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-semibold">Features</TableHead>
                                        {unifiedPlans.map((plan) => {
                                            return (
                                                <TableHead key={plan.planId} className="text-center font-semibold">
                                                    {plan.name}
                                                    <div className="text-xs font-normal text-muted-foreground mt-1">
                                                        {billingCycle === 'annual' ? 'Billed Annually' : 'Billed Monthly'}
                                                    </div>
                                                    {isLaunchActive && (
                                                        <div className="text-xs font-normal text-green-600 mt-1">
                                                            {discountPercent}% OFF
                                                        </div>
                                                    )}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Core Features */}
                                    <TableRow>
                                        <TableCell className="font-medium">Credits</TableCell>
                                        <TableCell className="text-center">40</TableCell>
                                        <TableCell className="text-center">180</TableCell>
                                        <TableCell className="text-center">1,000</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Image Generations</TableCell>
                                        <TableCell className="text-center">80</TableCell>
                                        <TableCell className="text-center">360</TableCell>
                                        <TableCell className="text-center">2,000</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Image Edits</TableCell>
                                        <TableCell className="text-center">40</TableCell>
                                        <TableCell className="text-center">180</TableCell>
                                        <TableCell className="text-center">1,000</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Processing Speed</TableCell>
                                        <TableCell className="text-center">Standard</TableCell>
                                        <TableCell className="text-center">Faster</TableCell>
                                        <TableCell className="text-center">Highest Priority</TableCell>
                                    </TableRow>

                                    {/* Support Features */}
                                    <TableRow className="bg-muted/50">
                                        <TableCell className="font-medium">Email Support</TableCell>
                                        <TableCell className="text-center">
                                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="bg-muted/50">
                                        <TableCell className="font-medium">Dedicated Support</TableCell>
                                        <TableCell className="text-center">
                                            <X className="h-4 w-4 text-red-500 mx-auto" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <X className="h-4 w-4 text-red-500 mx-auto" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                All plans include secure cloud processing, mobile app access, and regular feature updates.
              </p>
            </div> */}
                    </CardContent>
                </Card>
            </div>

            {/* Downgrade Confirmation Modal */}
            <Dialog open={showDowngradeModal} onOpenChange={setShowDowngradeModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Plan Downgrade
                        </DialogTitle>
                        <DialogDescription>
                            You're about to downgrade your subscription. Please review what will change.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {pendingPlanId && currentPlan && (
                            <div className="space-y-4">
                                {/* Current vs New Plan Comparison */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Current Plan</h4>
                                        <div className="p-3 border rounded-lg bg-green-50">
                                            <p className="font-semibold">{currentPlan.name}</p>
                                            <p className="text-sm text-muted-foreground">${currentPlan.price}/month</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">New Plan</h4>
                                        <div className="p-3 border rounded-lg">
                                            <p className="font-semibold">{paymentPlans[pendingPlanId as keyof typeof paymentPlans]?.name}</p>
                                            <p className="text-sm text-muted-foreground">${paymentPlans[pendingPlanId as keyof typeof paymentPlans]?.price}/month</p>
                                        </div>
                                    </div>
                                </div>

                                {/* What Changes */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">What will change:</h4>
                                    <div className="space-y-2">
                                        {(() => {
                                            const newPlan = paymentPlans[pendingPlanId as keyof typeof paymentPlans];
                                            const currentFeatures = currentPlan.features || [];
                                            const newFeatures = newPlan?.features || [];

                                            const lostFeatures = currentFeatures.filter(feature => !newFeatures.includes(feature));

                                            return (
                                                <>
                                                    {lostFeatures.length > 0 && (
                                                        <div className="p-3 bg-red-50 rounded-lg">
                                                            <p className="text-sm font-medium text-red-800 mb-2">You will lose:</p>
                                                            <ul className="text-sm text-red-700 space-y-1">
                                                                {lostFeatures.map((feature, index) => (
                                                                    <li key={index} className="flex items-center gap-2">
                                                                        <X className="h-3 w-3" />
                                                                        {feature}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    <div className="p-3 bg-blue-50 rounded-lg">
                                                        <p className="text-sm text-blue-800">
                                                            <strong>Important:</strong> Your downgrade will be scheduled for the end of your current billing cycle
                                                            {subscription?.billingEndDate && (
                                                                <span>
                                                                    {' '}(approximately{' '}
                                                                    {(() => {
                                                                        const lastPayment = new Date(subscription.billingEndDate);
                                                                        const nextBilling = new Date(lastPayment);
                                                                        nextBilling.setMonth(nextBilling.getMonth() + 1);
                                                                        return nextBilling.toLocaleDateString();
                                                                    })()})
                                                                </span>
                                                            )}
                                                            . You'll continue to have access to all your current plan features until then.
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleDowngradeCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleDowngradeConfirm} disabled={isPaymentLoading}>
                            {isPaymentLoading ? 'Processing...' : 'Confirm Downgrade'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SubscriptionManagementPage;