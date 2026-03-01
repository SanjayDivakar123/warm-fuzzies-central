import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2, Plus, RefreshCw } from 'lucide-react';

interface PaymentMethodCardProps {
  company: {
    id: string;
    name: string;
    credit_balance?: number;
  };
}

interface PaymentMethodInfo {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export default function PaymentMethodCard({ company }: PaymentMethodCardProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodInfo | null>(null);
  const { toast } = useToast();

  const isUnlimited = company.name === "RoleColorFinderLLC";

  const fetchPaymentMethod = async () => {
    if (isUnlimited) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('manage-payment-method', {
        body: {
          company_id: company.id,
          action: 'get_payment_method'
        }
      });

      if (error) throw error;

      if (data.hasPaymentMethod) {
        setPaymentMethod(data.paymentMethod);
      } else {
        setPaymentMethod(null);
      }
    } catch (error: any) {
      console.error('Error fetching payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethod();
  }, [company.id]);

  // Check for payment setup success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_setup') === 'success') {
      toast({
        title: 'Payment method updated',
        description: 'Your payment method has been successfully saved.',
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh payment method
      fetchPaymentMethod();
    } else if (params.get('payment_setup') === 'cancelled') {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleUpdatePaymentMethod = async () => {
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manage-payment-method', {
        body: {
          company_id: company.id,
          action: 'setup_payment_method',
          success_url: `${window.location.origin}/b2b/dashboard?payment_setup=success`,
          cancel_url: `${window.location.origin}/b2b/dashboard?payment_setup=cancelled`
        }
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error setting up payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set up payment method',
        variant: 'destructive',
      });
      setUpdating(false);
    }
  };

  const getBrandIcon = (brand: string) => {
    // Could add brand-specific icons here
    return <CreditCard className="h-5 w-5" />;
  };

  const formatBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (isUnlimited) {
    return (
      <Card id="payment-method-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Manage your payment method on file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg">
            <Badge variant="secondary" className="text-sm">
              ∞ Unlimited Account - No Payment Required
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="payment-method-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <CardDescription>
          Your payment method is used for auto-charging when inviting new employees ($20/seat)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethod ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                {getBrandIcon(paymentMethod.brand)}
                <div>
                  <p className="font-medium">
                    {formatBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleUpdatePaymentMethod}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Update Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <p className="text-sm text-amber-800 font-medium">No payment method on file</p>
                <p className="text-xs text-amber-600 mt-1">
                  Add a payment method to enable auto-charging for new invites
                </p>
              </div>
            </div>

            <Button 
              className="w-full gap-2"
              onClick={handleUpdatePaymentMethod}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Payment Method
            </Button>
          </div>
        )}

        {/* Credit Balance Display */}
        {(company.credit_balance ?? 0) > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
              <span className="text-sm text-green-800">Billing Credits</span>
              <span className="font-semibold text-green-700">
                ${(company.credit_balance || 0).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Credits are automatically applied before charging your card
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}