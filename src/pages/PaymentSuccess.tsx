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
  const [purchaseRecordId, setPurchaseRecordId] = useState<string | null>(null);
  
  const assessmentType = searchParams.get('type') as 'premium' | 'pro';
  const stripeSessionId = searchParams.get('session_id');

  useEffect(() => {
    // Store the successful payment in the database
    if (user && assessmentType) {
      storePaymentRecord();
      
      // Fire Google Ads conversion tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17863629259/VC_nCNu61uAbEMuzhcZC',
          'transaction_id': `${user.id}_${assessmentType}_${Date.now()}`
        });
        console.log('Google Ads conversion tracked for purchase');
      }
    }
  }, [user, assessmentType]);

  const storePaymentRecord = async () => {
    try {
      console.log('Storing payment record for user:', user?.id, 'type:', assessmentType);

      if (!user || !assessmentType) {
        return;
      }
      
      // Store payment verification in localStorage for immediate access
      const paymentKey = `payment_verified_${assessmentType}_${user?.id}`;
      const paymentVerification = {
        timestamp: new Date().toISOString(),
        type: assessmentType,
        userId: user?.id
      };
      localStorage.setItem(paymentKey, JSON.stringify(paymentVerification));

      const nowIso = new Date().toISOString();
      const purchaseLabel = `${assessmentType.toUpperCase()} Purchase ${new Date(nowIso).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;

      const { data: existingRows, error: existingError } = await supabase
        .from('assessment_results')
        .select('id, results')
        .eq('user_id', user.id)
        .eq('assessment_type', assessmentType)
        .order('created_at', { ascending: false })
        .limit(50);

      if (existingError) {
        console.error('Error checking existing purchase records:', existingError);
      }

      const existingUnstartedPurchase = (existingRows || []).find((row: any) => {
        const results = row.results as any;
        return results?.status === 'payment_completed' && results?.assessment_started !== true;
      });

      if (existingUnstartedPurchase) {
        setPurchaseRecordId(existingUnstartedPurchase.id);
        console.log('Existing unstarted purchase found. Reusing purchase row:', existingUnstartedPurchase.id);
        await consumeRcaiDiscountIfAny(existingUnstartedPurchase.id);
        return;
      }
      
      // Also store in Supabase for persistence
      const { data, error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: user?.id,
          assessment_type: assessmentType,
          results: { 
            name: purchaseLabel,
            status: 'payment_completed', 
            purchased_at: nowIso,
            assessment_started: false
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Database error:', error);
      } else {
        console.log('Payment record stored successfully:', data);
        setPurchaseRecordId(data.id);
        await consumeRcaiDiscountIfAny(data.id);
      }
    } catch (error) {
      console.error('Error storing payment record:', error);
    }
  };

  // Atomically marks the RoleColorAI member discount as consumed via shared RPC.
  // If the row is already consumed, Postgres raises 23505 (unique_violation) and
  // we surface that to the user — the payment side must then refund or charge full price.
  const consumeRcaiDiscountIfAny = async (assessmentId: string | null) => {
    if (!assessmentId) return;
    try {
      const { error } = await (supabase as any).rpc('rolecolorai_consume_discount', {
        p_assessment_id: assessmentId,
        p_order_id: stripeSessionId,
      });
      if (error) {
        if ((error as any).code === '23505') {
          console.warn('RCAI discount already consumed — full price applies / refund needed');
          toast({
            title: 'Discount already used',
            description: "Your RoleColorAI discount was already redeemed. We'll charge full price or issue a refund as needed.",
            variant: 'destructive',
          });
          return;
        }
        console.warn('rolecolorai_consume_discount error:', error);
      }
    } catch (err) {
      console.warn('rolecolorai_consume_discount unexpected error:', err);
    }
  };

  const handleStartAssessment = () => {
    const query = purchaseRecordId ? `?purchase=${purchaseRecordId}` : '';
    navigate(`/${assessmentType}-assessment${query}`);
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