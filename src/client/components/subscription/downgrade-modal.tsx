import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, X, Check } from 'lucide-react';
import { PaymentPlanId, paymentPlans } from '../../../server/payment/plans';

interface DowngradeModalProps {
    showDowngradeModal: boolean;
    setShowDowngradeModal: (show: boolean) => void;
    pendingPlanId: PaymentPlanId | null;
    currentPlan: any;
    subscription: any;
    isPaymentLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const DowngradeModal: React.FC<DowngradeModalProps> = ({
    showDowngradeModal,
    setShowDowngradeModal,
    pendingPlanId,
    currentPlan,
    subscription,
    isPaymentLoading,
    onConfirm,
    onCancel
}) => {
    return (
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

                                        const lostFeatures = currentFeatures.filter((feature: string) => !newFeatures.includes(feature));

                                        return (
                                            <>
                                                {lostFeatures.length > 0 && (
                                                    <div className="p-3 bg-red-50 rounded-lg">
                                                        <p className="text-sm font-medium text-red-800 mb-2">You will lose:</p>
                                                        <ul className="text-sm text-red-700 space-y-1">
                                                            {lostFeatures.map((feature: string, index: number) => (
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
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isPaymentLoading}>
                        {isPaymentLoading ? 'Processing...' : 'Confirm Downgrade'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DowngradeModal;