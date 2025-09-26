import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Settings, Check, X } from 'lucide-react';
import { BillingCycle } from '../../utils/pricing-calculations';
import {
    getUnifiedPlans,
    calculatePlanPricing,
    calculateAnnualSavings,
    getMaxAnnualSavingsPercent,
    formatPrice,
} from '../../utils/pricing-calculations';
import { paymentPlans, PaymentPlanId } from '../../../server/payment/plans';

interface PlanComparisonCardProps {
    subscription: any;
    billingCycle: BillingCycle;
    setBillingCycle: (cycle: BillingCycle) => void;
    isLaunchActive: boolean;
    discountPercent: number;
    isPaymentLoading: boolean;
    errorMessage: string | null;
    onSubscribeClick: (planId: PaymentPlanId) => void;
}

const PlanComparisonCard: React.FC<PlanComparisonCardProps> = ({
    subscription,
    billingCycle,
    setBillingCycle,
    isLaunchActive,
    discountPercent,
    isPaymentLoading,
    errorMessage,
    onSubscribeClick
}) => {
    const unifiedPlans = getUnifiedPlans();
    const maxAnnualSavings = getMaxAnnualSavingsPercent();

    // Helper function to get button text and variant for each plan
    const getButtonConfig = (plan: any) => {
        if (!subscription?.isSubscribed) {
            return { text: 'Start Subscription', variant: 'default' as const, disabled: false, hidden: false };
        }

        if (subscription.subscriptionPlan === plan.planId) {
            return { text: 'Current Plan', variant: 'outline' as const, disabled: true, hidden: false };
        }

        const currentPlan = subscription?.subscriptionPlan
            ? paymentPlans[subscription.subscriptionPlan as keyof typeof paymentPlans]
            : null;

        if (currentPlan) {
            // Get the plan price from paymentPlans for comparison
            const planPrice = paymentPlans[plan.planId as keyof typeof paymentPlans]?.price || 0;
            const currentPrice = currentPlan.price;

            const isUpgrade = planPrice > currentPrice;
            const isDowngrade = planPrice < currentPrice;

            if (isUpgrade) {
                return { text: 'Upgrade Now', variant: 'default' as const, disabled: false, hidden: false };
            } else if (isDowngrade) {
                // Temporarily disable downgrade buttons by hiding them
                return { text: 'Downgrade Plan', variant: 'secondary' as const, disabled: false, hidden: true };
            }
        }

        return { text: 'Start Subscription', variant: 'default' as const, disabled: false, hidden: false };
    };

    return (
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
                                        
                                        // Hide downgrade buttons temporarily
                                        if (buttonConfig.hidden) {
                                            return null;
                                            // return (
                                            //     <div className="w-full h-10 flex items-center justify-center text-sm text-muted-foreground">
                                            //         Downgrades temporarily unavailable
                                            //     </div>
                                            // );
                                        }
                                        
                                        return (
                                            <Button
                                                onClick={() => onSubscribeClick(plan.planId)}
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
            </CardContent>
        </Card>
    );
};

export default PlanComparisonCard;