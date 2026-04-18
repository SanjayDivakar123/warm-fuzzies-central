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
  assessmentType?: 'premium' | 'pro';
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

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page with return path
      navigate('/auth', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [user, loading, navigate, location]);

  useEffect(() => {
    if (user && requiresPayment && assessmentType) {
      checkPaymentStatus();
    }
  }, [user, requiresPayment, assessmentType, location.search]);

  const checkPaymentStatus = async () => {
    if (!user) return;
    
    setCheckingPayment(true);
    try {
      const purchaseId = new URLSearchParams(location.search).get('purchase');

      // Resume access if the user has an in-progress paid assessment attempt.
      const { data: inProgressRows, error: inProgressError } = await supabase
        .from('assessment_progress')
        .select('id, results')
        .eq('user_id', user.id)
        .eq('assessment_type', assessmentType)
        .is('dominant_color', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!inProgressError && inProgressRows && inProgressRows.length > 0) {
        const progressResults = inProgressRows[0].results as any;
        const answeredCount = Object.keys(progressResults?.answers || {}).length;
        if (answeredCount > 0) {
          setPaymentVerified(true);
          setCheckingPayment(false);
          return;
        }
      }

      const paymentKey = `payment_verified_${assessmentType}_${user.id}`;
      const { data, error } = await supabase
        .from('assessment_results')
        .select('id, results')
        .eq('user_id', user.id)
        .eq('assessment_type', assessmentType)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error checking payment status:', error);
        setPaymentVerified(false);
      } else {
        const availablePurchase = (data || []).find((record: any) => {
          const results = record.results as any;
          const isUnconsumedPurchase = results?.status === 'payment_completed' && results?.assessment_started !== true;
          if (!isUnconsumedPurchase) {
            return false;
          }

          if (!purchaseId) {
            return true;
          }

          return record.id === purchaseId;
        });

        const verified = Boolean(availablePurchase);
        setPaymentVerified(verified);

        if (verified) {
          const newVerification = {
            timestamp: new Date().toISOString(),
            type: assessmentType,
            userId: user.id,
            purchaseId: availablePurchase?.id || null,
          };
          localStorage.setItem(paymentKey, JSON.stringify(newVerification));
        } else {
          localStorage.removeItem(paymentKey);
        }
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

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Show payment required screen if payment verification fails
  if (requiresPayment && !paymentVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {assessmentType === 'premium' ? 'Premium' : 'Professional'} Access Required
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
                Upgrade to {assessmentType === 'premium' ? 'Premium' : 'Professional'}
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