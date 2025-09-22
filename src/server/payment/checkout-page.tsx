import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../client/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../client/components/ui/card';

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'canceled' | 'error'>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const isSuccess = queryParams.get('success') === 'true';
    const isCanceled = queryParams.get('canceled') === 'true';

    if (isSuccess) {
      setPaymentStatus('success');
      // Redirect to dashboard after 5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
    } else if (isCanceled) {
      setPaymentStatus('canceled');
    } else {
      setPaymentStatus('error');
    }
  }, [location.search, navigate]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'canceled':
        return <XCircle className="w-16 h-16 text-orange-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          title: 'Payment Successful!',
          message: 'Thank you for your purchase. Your account has been upgraded and you now have access to all premium features.',
          action: 'Redirecting to dashboard...'
        };
      case 'canceled':
        return {
          title: 'Payment Canceled',
          message: 'Your payment was canceled. No charges were made to your account.',
          action: 'You can try again or choose a different plan.'
        };
      case 'error':
        return {
          title: 'Something went wrong',
          message: 'There was an issue processing your payment. Please try again or contact support.',
          action: 'Please try again or contact support if the problem persists.'
        };
      default:
        return {
          title: 'Processing...',
          message: 'Please wait while we process your payment.',
          action: 'This may take a few moments.'
        };
    }
  };

  const status = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{status.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{status.message}</p>
          <p className="text-sm text-muted-foreground">{status.action}</p>
          
          {paymentStatus !== 'loading' && paymentStatus !== 'success' && (
            <div className="flex flex-col gap-3 mt-8">
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Button>
              
              {paymentStatus === 'error' && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          )}

          {paymentStatus === 'success' && (
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full mt-8"
            >
              Go to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}