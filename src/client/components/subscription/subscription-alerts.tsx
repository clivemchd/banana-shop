import React from 'react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Check, AlertTriangle } from 'lucide-react';

interface SubscriptionAlertsProps {
    showScheduledMessage: boolean;
    subscription: any;
}

const SubscriptionAlerts: React.FC<SubscriptionAlertsProps> = ({
    showScheduledMessage,
    subscription
}) => {
    return (
        <>
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
        </>
    );
};

export default SubscriptionAlerts;