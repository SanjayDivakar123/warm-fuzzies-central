import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, CheckCircle, Loader2, CreditCard, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/nested-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckout = async () => {
    console.log("=== PAYMENT FLOW STARTED ===");
    console.log("Product type:", productType);
    console.log("User:", user?.email);
    console.log("Promo code:", promoCode);

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with payment.",
        variant: "destructive",
      });
      setOpen(false);
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      
      const paymentData = {
        productType,
        successUrl: `${window.location.origin}/payment-success?type=${productType}`,
        cancelUrl: `${window.location.origin}/pricing`,
        ...(promoCode && promoApplied && { promoCode }),
      };
      
      console.log("Creating payment with data:", paymentData);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: paymentData
      });

      console.log("Payment response:", { data, error });

      if (error) {
        console.error("Payment creation error:", error);
        throw new Error(error.message || "Failed to create payment");
      }

      if (!data?.url) {
        throw new Error('No payment URL received from Stripe');
      }

      console.log("Redirecting to Stripe:", data.url);
      window.location.href = data.url;
      
    } catch (error: any) {
      console.error("=== PAYMENT ERROR ===", error);
      setLoading(false);
      toast({
        title: "Payment Error", 
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    // Mark promo as applied - it will be validated by Stripe
    setPromoApplied(true);
    toast({
      title: "Promo Code Added",
      description: "Your promo code will be applied at checkout.",
    });
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoApplied(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>
            You're purchasing: <strong className="text-foreground">{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium text-foreground">{productName}</span>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">{price}</span>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Have a promo code?
            </Label>
            {promoApplied ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Code "{promoCode.toUpperCase()}" will be applied
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="text-muted-foreground hover:text-foreground h-auto p-1"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Promo codes will be validated by Stripe at checkout
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
            <span>You'll be redirected to Stripe's secure checkout</span>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleCheckout} disabled={loading} className="min-w-[140px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Checkout {price}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PaymentDialog };
