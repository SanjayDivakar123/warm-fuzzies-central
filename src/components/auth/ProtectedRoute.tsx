import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Lock, CreditCard } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPayment?: boolean;
  assessmentType?: 'premium' | 'pro' | 'student';
}

export const ProtectedRoute = ({ 
  children, 
  requiresPayment = false, 
  assessmentType 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const preview = new URLSearchParams(location.search).get('preview') === '1';

  useEffect(() => {
    if (!loading && !user && !preview) {
      // Redirect to auth page with return path
      navigate('/auth', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [user, loading, navigate, location, preview]);

  useEffect(() => {
    if (user && requiresPayment && assessmentType && !preview) {
      checkPaymentStatus();
    }
  }, [user, requiresPayment, assessmentType, preview]);

  const checkPaymentStatus = async () => {
    if (!user) return;
    
    setCheckingPayment(true);
    try {
      // First check localStorage for immediate verification
      const paymentKey = `payment_verified_${assessmentType}_${user.id}`;
      const paymentVerification = localStorage.getItem(paymentKey);
      
      if (paymentVerification) {
        const verification = JSON.parse(paymentVerification);
        // Check if payment was verified within the last 24 hours
        const verificationTime = new Date(verification.timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - verificationTime.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        if (hoursDiff < 24) {
          setPaymentVerified(true);
          setCheckingPayment(false);
          return;
        } else {
          // Payment verification expired
          localStorage.removeItem(paymentKey);
        }
      }
      
      // Fallback: Check Supabase for payment record
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_type', assessmentType)
        .limit(1);

      if (error) {
        console.error('Error checking payment status:', error);
        setPaymentVerified(false);
      } else if (data && data.length > 0) {
        const record = data[0];
        const results = record.results as any;
        
        // Check if payment was completed
        if (results?.status === 'payment_completed') {
          setPaymentVerified(true);
          // Restore localStorage verification
          const newVerification = {
            timestamp: new Date().toISOString(),
            type: assessmentType,
            userId: user.id
          };
          localStorage.setItem(paymentKey, JSON.stringify(newVerification));
        } else {
          setPaymentVerified(false);
        }
      } else {
        setPaymentVerified(false);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setPaymentVerified(false);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  // Preview mode bypasses auth and payment checks for quick reviews
  if (preview) {
    return <>{children}</>;
  }

  if (loading || checkingPayment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>{checkingPayment ? 'Verifying access...' : 'Loading...'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user && !preview) {
    return null; // Will redirect via useEffect
  }

  // Show payment required screen if payment verification fails
  if (requiresPayment && !paymentVerified && !preview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {assessmentType === 'premium' ? 'Premium' : assessmentType === 'pro' ? 'Professional' : 'Student'} Access Required
              </h2>
              <p className="text-muted-foreground">
                This assessment requires a {assessmentType} plan purchase to access.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleUpgrade}
                className="w-full"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                View Pricing
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};