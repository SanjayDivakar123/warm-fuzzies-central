import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const assessmentType = searchParams.get('type') as 'premium' | 'pro';

  useEffect(() => {
    // Store the successful payment in the database
    if (user && assessmentType) {
      storePaymentRecord();
    }
  }, [user, assessmentType]);

  const storePaymentRecord = async () => {
    try {
      console.log('Storing payment record for user:', user?.id, 'type:', assessmentType);
      
      // Store payment verification in localStorage for immediate access
      const paymentKey = `payment_verified_${assessmentType}_${user?.id}`;
      const paymentVerification = {
        timestamp: new Date().toISOString(),
        type: assessmentType,
        userId: user?.id
      };
      localStorage.setItem(paymentKey, JSON.stringify(paymentVerification));
      
      // Also store in Supabase for persistence
      const { data, error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: user?.id,
          assessment_type: assessmentType,
          results: { 
            status: 'payment_completed', 
            purchased_at: new Date().toISOString(),
            assessment_started: false
          }
        });

      if (error) {
        console.error('Database error:', error);
      } else {
        console.log('Payment record stored successfully:', data);
      }
    } catch (error) {
      console.error('Error storing payment record:', error);
    }
  };

  const handleStartAssessment = () => {
    navigate(`/${assessmentType}-assessment`);
  };

  if (!user || !assessmentType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Invalid Payment Link</h2>
            <p className="text-muted-foreground mb-4">
              This payment link is invalid or you need to sign in.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button variant="outline" onClick={() => navigate('/pricing')}>
                Return to Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            🎉 Payment Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Your {assessmentType} assessment is now unlocked and ready to use!
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 text-sm mb-2">
              ✅ What's Next:
            </h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Your assessment is now available in your account</li>
              <li>• You can start now or return later - it's saved to your profile</li>
              <li>• Results will be available immediately after completion</li>
              <li>• Access your results anytime from your dashboard</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleStartAssessment}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Start {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} Assessment Now
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;