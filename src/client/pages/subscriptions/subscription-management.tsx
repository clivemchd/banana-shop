import React from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getCustomerPortalUrl, getCurrentUserSubscription, getLaunchSettings, generateCheckoutSession } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { paymentPlans, PaymentPlanId, getSubscriptionPaymentPlanIds } from '../../../server/payment/plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { CreditCard, Calendar, Crown, Settings, ExternalLink, Check, X } from 'lucide-react';
import { useState } from 'react';
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

// Temporary type until operation is generated
type UserSubscriptionInfo = {
    isSubscribed: boolean;
    subscriptionStatus: string | null;
    subscriptionPlan: PaymentPlanId | null;
    datePaid: Date | null;
    credits: number;
    paymentProcessorUserId: string | null;
};

const SubscriptionManagementPage = () => {
    const { data: user } = useAuth();
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const subscription: UserSubscriptionInfo | null = subscriptionData || (user ? {
        isSubscribed: (user as any).subscriptionStatus === 'active',
        subscriptionStatus: (user as any).subscriptionStatus || null,
        subscriptionPlan: (user as any).subscriptionPlan || null,
        datePaid: (user as any).datePaid || null,
        credits: (user as any).credits || 0,
        paymentProcessorUserId: (user as any).paymentProcessorUserId || null,
    } : null);

    // Check if launch offer is active from server data
    const isLaunchActive = launchSettings?.isLaunchOfferActive || false;
    const discountPercent = launchSettings?.discountPercent || 0;

    // Calculate maximum annual savings for the badge using shared utility
    const maxAnnualSavings = getMaxAnnualSavingsPercent();
    
    // Get unified plans
    const unifiedPlans = getUnifiedPlans();



    // Handle subscription purchase
    const handleSubscribeClick = async (planId: PaymentPlanId) => {
        if (!user) {
            navigate('/signin');
            return;
        }

        try {
            setIsPaymentLoading(true);
            setErrorMessage(null);
            
            const { sessionUrl } = await generateCheckoutSession({
                paymentPlanId: planId,
                billingCycle: billingCycle
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

    // Get unified plan data for consistent pricing calculations
    const currentUnifiedPlan = currentPlan && subscription?.subscriptionPlan
        ? unifiedPlans.find(p => p.planId === subscription.subscriptionPlan)
        : null;

    // Detect billing cycle - determine if user is on annual or monthly subscription
    // This is a simplified detection method - ideally this should be stored in the database
    const detectBillingCycle = (): BillingCycle => {
        if (!currentPlan || !currentUnifiedPlan || !subscription) return 'monthly';
        
        // If the plan has an annual price, check if current subscription matches annual pricing pattern
        if (currentUnifiedPlan.annualPrice) {
            // Heuristic: if subscription price suggests annual billing (typically larger amounts)
            // This is imperfect - ideally billing cycle should be stored in subscription data
            const annualMonthlyEquivalent = currentUnifiedPlan.annualPrice / 12;
            const monthlyPrice = currentPlan.price;
            
            // If closer to annual equivalent price, likely annual billing
            return Math.abs(currentPlan.price - annualMonthlyEquivalent) < Math.abs(currentPlan.price - monthlyPrice)
                ? 'annual'
                : 'monthly';
        }
        
        return 'monthly';
    };

    const currentBillingCycle = detectBillingCycle();

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

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your subscription and billing preferences</p>
                </div>

                {/* Current Subscription Overview */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5" />
                            Current Subscription
                        </CardTitle>
                        <CardDescription>
                            Your active plan and billing information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {/* Plan Info - Only show if user has a subscription */}
                            {currentPlan && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Plan</p>
                                    <p className="text-2xl font-semibold">{currentPlan.name}</p>
                                    <div className="flex items-center gap-2">
                                        {isLaunchActive ? (
                                            <>
                                                <p className="text-muted-foreground">
                                                    {currentUnifiedPlan 
                                                        ? `$${formatPrice(
                                                            calculatePlanPricing(currentUnifiedPlan, currentBillingCycle, true, discountPercent).displayPrice
                                                          )}/${currentBillingCycle === 'annual' ? 'year' : 'month'}`
                                                        : `$${Math.round(currentPlan.price * (1 - discountPercent / 100))}/month`
                                                    }
                                                </p>
                                                <Badge className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                                    {discountPercent}% OFF
                                                </Badge>
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                {currentUnifiedPlan 
                                                    ? `$${formatPrice(
                                                        calculatePlanPricing(currentUnifiedPlan, currentBillingCycle, false).displayPrice
                                                      )}/${currentBillingCycle === 'annual' ? 'year' : 'month'}`
                                                    : `$${currentPlan.price}/month`
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div>{getSubscriptionStatusBadge()}</div>
                            </div>

                            {/* Credits Available */}
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Credits Available</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <p className="text-lg font-semibold">{subscription?.credits || 0}</p>
                                </div>
                            </div>

                            {/* Next Billing Date */}
                            {subscription?.datePaid && subscription?.subscriptionStatus === 'active' && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Next Billing</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p>
                                            {(() => {
                                                const lastPayment = new Date(subscription.datePaid);
                                                const nextBilling = new Date(lastPayment);
                                                // Assume monthly billing by default, adjust based on detected cycle
                                                nextBilling.setMonth(nextBilling.getMonth() + (currentBillingCycle === 'annual' ? 12 : 1));
                                                return nextBilling.toLocaleDateString();
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            )}

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
                                disabled={portalLoading || !customerPortalUrl}
                                className="w-full"
                                variant="outline"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {portalLoading ? 'Loading...' : 'Open Billing Portal'}
                            </Button>

                            {portalError && (
                                <p className="text-sm text-destructive">
                                    Error loading billing portal. Please try again.
                                </p>
                            )}

                            <div className="text-xs text-muted-foreground">
                                Opens Stripe Customer Portal in a new window to manage payment methods,
                                invoices, and subscription settings.
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
                                            {isCurrentPlan ? (
                                                <Button variant="outline" className="w-full" disabled>
                                                    Current Plan
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => handleSubscribeClick(plan.planId)}
                                                    disabled={isPaymentLoading}
                                                    variant={plan.isPopular ? "default" : "outline"}
                                                    className="w-full"
                                                >
                                                    {isPaymentLoading ? 'Processing...' : 'Start Subscription'}
                                                </Button>
                                            )}
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

                        {/* Billing Cycle Toggle */}
                        <div className="mb-8 flex justify-center">
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
        </div>
    );
};

export default SubscriptionManagementPage;