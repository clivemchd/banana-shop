import React from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getCustomerPortalUrl } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { paymentPlans, PaymentPlanId, getSubscriptionPaymentPlanIds } from '../../payment/plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CreditCard, Calendar, Crown, Settings, ExternalLink, Check, X } from 'lucide-react';
import Navbar from './landing/navbar';

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

    const {
        data: customerPortalUrl,
        isLoading: portalLoading,
        error: portalError
    } = useQuery(getCustomerPortalUrl);

    // Redirect to login if not authenticated
    if (!user) {
        navigate('/login');
        return null;
    }

    // Temporary: using user data directly until operation is generated
    const subscription: UserSubscriptionInfo | null = user ? {
        isSubscribed: (user as any).subscriptionStatus === 'active',
        subscriptionStatus: (user as any).subscriptionStatus || null,
        subscriptionPlan: (user as any).subscriptionPlan || null,
        datePaid: (user as any).datePaid || null,
        credits: (user as any).credits || 0,
        paymentProcessorUserId: (user as any).paymentProcessorUserId || null,
    } : null;

    // Helper function to navigate to pricing section
    const handleShowPlanFeatures = () => {
        navigate('/#pricing');
        // Small delay to ensure navigation completes before scrolling
        setTimeout(() => {
            const pricingSection = document.getElementById('pricing');
            if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const currentPlan = subscription?.subscriptionPlan
        ? paymentPlans[subscription.subscriptionPlan as keyof typeof paymentPlans]
        : null;

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
            <Navbar showFeatures={false} showPricing={false} />

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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Plan Info - Only show if user has a subscription */}
                            {currentPlan && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Plan</p>
                                    <p className="text-2xl font-semibold">{currentPlan.name}</p>
                                    <p className="text-muted-foreground">${currentPlan.price}/month</p>
                                </div>
                            )}

                            {/* Status */}
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div>{getSubscriptionStatusBadge()}</div>
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
                            {getSubscriptionPaymentPlanIds().map((planId) => {
                                const plan = paymentPlans[planId];
                                const isCurrentPlan = subscription?.subscriptionPlan === planId;

                                return (
                                    <Card key={planId} className={`text-center relative ${isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''}`}>
                                        <CardHeader className="pb-2">
                                            {isCurrentPlan && (
                                                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" variant="default">
                                                    Current
                                                </Badge>
                                            )}
                                            {plan.isPopular && !isCurrentPlan && (
                                                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" variant="secondary">
                                                    Popular
                                                </Badge>
                                            )}
                                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                                            <div className="space-y-1">
                                                <p className="text-3xl font-bold">${plan.price}</p>
                                                <p className="text-sm text-muted-foreground">per month</p>
                                                {plan.annualPrice && (
                                                    <p className="text-xs text-muted-foreground">
                                                        ${plan.annualPrice}/year (save ${(plan.price * 12) - plan.annualPrice})
                                                    </p>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            {isCurrentPlan ? (
                                                <Button variant="outline" className="w-full" disabled>
                                                    Current Plan
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleShowPlanFeatures}
                                                    variant={plan.isPopular ? "default" : "outline"}
                                                    className="w-full"
                                                >
                                                    Choose Plan
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Features Comparison Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-semibold">Features</TableHead>
                                        {getSubscriptionPaymentPlanIds().map((planId) => {
                                            const plan = paymentPlans[planId];
                                            return (
                                                <TableHead key={planId} className="text-center font-semibold">
                                                    {plan.name}
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