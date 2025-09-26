import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Crown, Calendar, RefreshCw } from 'lucide-react';
import { PaymentPlanId, paymentPlans } from '../../../server/payment/plans';
import { BillingCycle } from '../../utils/pricing-calculations';
import {
    getUnifiedPlans,
    calculatePlanPricing,
    formatPrice,
} from '../../utils/pricing-calculations';

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

interface CurrentSubscriptionCardProps {
    subscription: UserSubscriptionInfo | null;
    currentPlan: any;
    currentBillingCycle: BillingCycle;
    isLaunchActive: boolean;
    discountPercent: number;
    isSyncingCredits: boolean;
    syncMessage: string | null;
    onSyncCredits: () => void;
    cardTitle?: string;
    cardDescription?: string;
    isUpcoming?: boolean;
}

const CurrentSubscriptionCard: React.FC<CurrentSubscriptionCardProps> = ({
    subscription,
    currentPlan,
    currentBillingCycle,
    isLaunchActive,
    discountPercent,
    isSyncingCredits,
    syncMessage,
    onSyncCredits,
    cardTitle = "Current Subscription",
    cardDescription = "Your active plan and billing information",
    isUpcoming = false
}) => {
    const unifiedPlans = getUnifiedPlans();
    
    const currentUnifiedPlan = currentPlan && subscription?.subscriptionPlan
        ? unifiedPlans.find(p => p.planId === subscription.subscriptionPlan)
        : null;

    const getSubscriptionStatusBadge = () => {
        if (!subscription?.subscriptionStatus) {
            return <Badge variant="secondary">No Active Subscription</Badge>;
        }

        // For upcoming subscriptions, show different status
        if (isUpcoming) {
            return <Badge variant="secondary">Scheduled</Badge>;
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

    return (
        <Card className="mb-8">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5" />
                            {cardTitle}
                        </CardTitle>
                        <CardDescription>
                            {cardDescription}
                        </CardDescription>
                    </div>
                    {!isUpcoming && subscription?.subscriptionStatus === 'active' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onSyncCredits}
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
                                {isLaunchActive && (
                                    <Badge className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                        {discountPercent}% OFF
                                    </Badge>
                                )}
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

                    {/* Credits Available - Only show for current subscription, not upcoming */}
                    {!isUpcoming && (
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
                    )}

                    {/* Last Payment */}
                    {subscription?.datePaid && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                {isUpcoming ? 'Starts On' : 'Last Payment'}
                            </p>
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
                                {isUpcoming 
                                    ? 'First Billing'
                                    : subscription.isPlanRenewed === false 
                                        ? 'Ends On' 
                                        : 'Next Billing'
                                }
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
                    {subscription?.subscriptionStatus === 'active' && subscription.isPlanRenewed === false && !isUpcoming && (
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
    );
};

export default CurrentSubscriptionCard;