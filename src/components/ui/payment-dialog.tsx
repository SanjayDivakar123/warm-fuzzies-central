import * as React from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, CheckCircle, Loader2, CreditCard, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe("pk_live_51RHFpkCDzj7WV6yRVFhw6BnHx1FH0w28OMECRVRCVNfNzHqCUQDjNqjD3kRDh3n38n0TMVQNqFDo9dAR2qb0XJjI00y3xMQVYc");

interface PaymentFormProps {
  productType: "premium" | "pro" | "team";
  productName: string;
  price: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ productType, productName, price, description, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?type=${productType}`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        setLoading(false);
      } else {
        toast({
          title: "Payment Successful!",
          description: `Thank you for purchasing ${productName}`,
        });
        onSuccess();
        navigate(`/payment-success?type=${productType}`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: "tabs",
        }}
      />
      
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${price}`
          )}
        </Button>
      </div>
    </form>
  );
}

interface PaymentDialogProps {
  children: React.ReactNode;
  productType: "premium" | "pro" | "team";
  productName: string;
  price: string;
  description?: string;
}

function PaymentDialog({ children, productType, productName, price, description }: PaymentDialogProps) {
  const [promoCode, setPromoCode] = React.useState("");
  const [promoApplied, setPromoApplied] = React.useState(false);
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [finalPrice, setFinalPrice] = React.useState(price);
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const createPaymentIntent = async (withPromo?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          productType,
          promoCode: withPromo,
        }
      });

      if (error) throw error;

      setClientSecret(data.clientSecret);
      setFinalPrice(`$${(data.amount / 100).toFixed(0)}`);
      
      if (data.discountPercent > 0) {
        setDiscountPercent(data.discountPercent);
        setPromoApplied(true);
      }
    } catch (err: any) {
      console.error("Error creating payment intent:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue with payment.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      createPaymentIntent();
    } else {
      // Reset state when dialog closes
      setClientSecret(null);
      setPromoCode("");
      setPromoApplied(false);
      setDiscountPercent(0);
      setFinalPrice(price);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setPromoLoading(true);
    await createPaymentIntent(promoCode);
    setPromoLoading(false);
    
    if (discountPercent > 0) {
      toast({
        title: "Promo Code Applied!",
        description: `You saved ${discountPercent}% on your purchase.`,
      });
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoApplied(false);
    setDiscountPercent(0);
    createPaymentIntent();
  };

  const handleSuccess = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>
            {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Price Display */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <div className="flex items-center gap-2">
                {discountPercent > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">{price}</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      -{discountPercent}%
                    </span>
                  </>
                )}
                <span className="text-2xl font-bold text-foreground">{finalPrice}</span>
              </div>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Promo code
            </Label>
            {promoApplied ? (
              <div className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {promoCode.toUpperCase()} applied
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="text-muted-foreground hover:text-foreground h-auto p-1 text-xs"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  className="h-9"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || promoLoading}
                  className="h-9"
                >
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
          </div>

          {/* Payment Form */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clientSecret ? (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#8B5CF6',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentForm
                productType={productType}
                productName={productName}
                price={finalPrice}
                description={description}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Failed to load payment form</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { PaymentDialog };
