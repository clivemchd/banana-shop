import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CreditCard, ExternalLink } from 'lucide-react';

interface BillingManagementCardProps {
    subscription: any;
    customerPortalUrl: string | null;
    portalLoading: boolean;
    portalError: any;
    onManageBilling: () => void;
    isFullWidth?: boolean;
}

const BillingManagementCard: React.FC<BillingManagementCardProps> = ({
    subscription,
    customerPortalUrl,
    portalLoading,
    portalError,
    onManageBilling,
    isFullWidth = false
}) => {
    return (
        <Card className={isFullWidth ? "lg:col-span-2" : ""}>
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
                    onClick={onManageBilling}
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
    );
};

export default BillingManagementCard;