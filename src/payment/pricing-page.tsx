import { CheckCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { generateCheckoutSession, getCustomerPortalUrl, useQuery } from 'wasp/client/operations';
import { Button } from '../client/components/ui/button';
import { Card, CardContent, CardFooter, CardTitle } from '../client/components/ui/card';
import { Badge } from '../client/components/ui/badge';
import { PaymentPlanId, paymentPlans, prettyPaymentPlanName, SubscriptionStatus, LAUNCH_DISCOUNT_PERCENT, calculateLaunchPrice, isLaunchOfferActive } from './plans';
import { cn } from '../client/utils/cn';

interface PaymentPlanCard {
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  planId: PaymentPlanId;
}

const createPaymentPlanCards = (): PaymentPlanCard[] => {
  const isLaunchActive = isLaunchOfferActive();
  
  return Object.entries(paymentPlans).map(([planId, plan]) => {
    const isSubscription = plan.effect.kind === 'subscription';
    const currentPrice = isLaunchActive && isSubscription ? calculateLaunchPrice(plan.price) : plan.price;
    
    return {
      name: plan.name,
      price: currentPrice,
      originalPrice: isLaunchActive && isSubscription ? plan.price : undefined,
      description: plan.description,
      features: plan.features,
      isPopular: plan.isPopular || false,
      planId: planId as PaymentPlanId,
    };
  });
};

export const PricingPage = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: user } = useAuth();
  const isUserSubscribed = !!user && !!user.subscriptionStatus && 
    user.subscriptionStatus !== SubscriptionStatus.Deleted;

  // Temporarily disable customer portal until we fix the query syntax
  const customerPortalUrl = null;
  const isCustomerPortalUrlLoading = false;
  const customerPortalUrlError = null;

  const paymentPlanCards = createPaymentPlanCards();
  const isLaunchActive = isLaunchOfferActive();

  const handleBuyNowClick = async (planId: PaymentPlanId) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    try {
      setIsPaymentLoading(true);
      setErrorMessage(null);
      
      const { sessionUrl } = await generateCheckoutSession(planId);
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

  const handleCustomerPortalClick = () => {
    if (customerPortalUrl) {
      window.location.href = customerPortalUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your needs. Upgrade or downgrade at any time.
          </p>
          
          {/* Launch Offer Banner */}
          {isLaunchActive && (
            <div className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-semibold">
              <Sparkles className="h-5 w-5" />
              <span>Launch Offer: 30% off first 3 months!</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-8 p-4 border border-red-200 bg-red-50 rounded-md">
            <p className="text-red-700 text-sm">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Customer Portal Button for Subscribed Users */}
        {isUserSubscribed && (
          <div className="text-center mb-8">
            <Button
              onClick={handleCustomerPortalClick}
              disabled={isCustomerPortalUrlLoading || !customerPortalUrl}
              variant="outline"
              size="lg"
            >
              Manage Your Subscription
            </Button>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {paymentPlanCards.map((plan) => (
            <Card 
              key={plan.planId} 
              className={cn(
                "relative overflow-hidden transition-all duration-200 hover:shadow-xl",
                plan.isPopular && "ring-2 ring-primary shadow-lg"
              )}
            >
              {plan.isPopular && (
                <Badge className="absolute top-4 right-4 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              {isLaunchActive && plan.originalPrice && (
                <Badge className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500">
                  30% OFF
                </Badge>
              )}

              <CardTitle className="p-6 pb-0">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardTitle>

              <CardContent className="p-6">
                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {paymentPlans[plan.planId].effect.kind === 'subscription' && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  
                  {plan.originalPrice && (
                    <div className="mt-1">
                      <span className="text-lg text-muted-foreground line-through">
                        ${plan.originalPrice}
                      </span>
                      <span className="ml-2 text-sm text-green-600 font-medium">
                        Save ${plan.originalPrice - plan.price}/month
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button
                  onClick={() => handleBuyNowClick(plan.planId)}
                  disabled={isPaymentLoading}
                  className={cn(
                    "w-full",
                    plan.isPopular && "bg-primary hover:bg-primary/90"
                  )}
                  variant={plan.isPopular ? "default" : "outline"}
                  size="lg"
                >
                  {isPaymentLoading ? 'Processing...' : 
                   paymentPlans[plan.planId].effect.kind === 'subscription' ? 'Start Subscription' : 'Buy Now'
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-8">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold mb-2">Can I change my plan later?</h4>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time through your account dashboard.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-muted-foreground">We accept all major credit cards, debit cards, and digital wallets through Stripe.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-muted-foreground">New users get 3 free credits to try out the platform before subscribing.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How does the launch offer work?</h4>
              <p className="text-muted-foreground">Get 30% off your subscription for the first 3 months. The discount is automatically applied at checkout.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;