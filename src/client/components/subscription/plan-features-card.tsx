import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Check, RefreshCw } from 'lucide-react';

interface PlanFeaturesCardProps {
    subscription: any;
    currentPlan: any;
    isSyncingCredits: boolean;
    syncMessage: string | null;
    onSyncCredits: () => void;
}

const PlanFeaturesCard: React.FC<PlanFeaturesCardProps> = ({
    subscription,
    currentPlan,
    isSyncingCredits,
    syncMessage,
    onSyncCredits
}) => {
    // Only show if user has an active subscription
    if (!subscription?.isSubscribed || !currentPlan) {
        return null;
    }

    return (
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
                        {currentPlan.features.map((feature: string, index: number) => (
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
                        onClick={onSyncCredits}
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
    );
};

export default PlanFeaturesCard;