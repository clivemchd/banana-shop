import React from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getCustomerPortalUrl } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { paymentPlans, PaymentPlanId, getSubscriptionPaymentPlanIds } from '../../payment/plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { CreditCard, Calendar, Crown, Settings, ExternalLink, Check } from 'lucide-react';
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Info */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-2xl font-semibold">
                  {currentPlan ? currentPlan.name : 'Free'}
                </p>
                {currentPlan && (
                  <p className="text-muted-foreground">${currentPlan.price}/month</p>
                )}
              </div>

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
          {/* Plan Features */}
          {subscription?.isSubscribed && currentPlan ? (
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>
                  You don't have an active subscription yet. Choose a plan to get started!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleShowPlanFeatures} className="w-full">
                  Show Plan Features
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Billing Management */}
          <Card>
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
        </div>        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Available Plans
            </CardTitle>
            <CardDescription>
              Compare plans and manage your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getSubscriptionPaymentPlanIds().map((planId) => {
                const plan = paymentPlans[planId];
                const isCurrentPlan = subscription?.subscriptionPlan === planId;
                const canUpgrade = currentPlan && plan.price > currentPlan.price;
                const canDowngrade = currentPlan && plan.price < currentPlan.price;
                
                return (
                  <Card key={planId} className={`relative ${isCurrentPlan ? 'border-primary' : ''}`}>
                    <CardHeader className="text-center pb-2">
                      {isCurrentPlan && (
                        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" variant="default">
                          Current Plan
                        </Badge>
                      )}
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold">${plan.price}</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {!isCurrentPlan && (
                        <Button 
                          onClick={handleShowPlanFeatures}
                          variant={canUpgrade ? "default" : canDowngrade ? "secondary" : "default"}
                          className="w-full"
                        >
                          {canUpgrade ? 'Upgrade Plan' : canDowngrade ? 'Downgrade Plan' : 'Get Started'}
                        </Button>
                      )}
                      {isCurrentPlan && (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <Separator className="my-6" />
            
            <div className="text-center">
              <Button onClick={handleShowPlanFeatures} variant="outline">
                Show Plan Features
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                View detailed feature comparison on the pricing section
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;