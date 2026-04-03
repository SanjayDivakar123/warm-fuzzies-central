import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getLocalizedPrice } from "@/lib/countryPricing";

interface PaymentButtonProps {
  productType: "premium" | "pro" | "team" | "career";
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  customAmount?: number;
  customDescription?: string;
}

export const PaymentButton = ({ 
  productType, 
  children, 
  className,
  variant = "default",
  size = "default",
  customAmount,
  customDescription
}: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePayment = async () => {
    console.log("=== PAYMENT FLOW STARTED ===");
    console.log("Product type:", productType);
    console.log("User:", user?.email);

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with payment.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      
      // Determine success and cancel URLs based on product type
      const successUrl = productType === 'career' 
        ? `${window.location.origin}/career-payment-success`
        : `${window.location.origin}/payment-success?type=${productType}`;
      
      const cancelUrl = productType === 'career'
        ? `${window.location.origin}/career-finder`
        : `${window.location.origin}/pricing`;

      const pricingProductType = productType === "team" ? "b2b" : (productType as "premium" | "pro" | "career");
      const usdPricing =
        pricingProductType === "premium" || pricingProductType === "pro"
          ? getLocalizedPrice(pricingProductType)
          : null;

      const paymentData = {
        productType,
        successUrl,
        cancelUrl,
        ...(usdPricing && {
          stripeCurrency: usdPricing.stripeCurrency,
          stripeAmountMinor: usdPricing.stripeAmountMinor,
          displayCurrency: usdPricing.displayCurrency,
          displayAmount: usdPricing.displayAmount,
          billingCountry: usdPricing.country,
        }),
        ...(customAmount && { customAmount }),
        ...(customDescription && { customDescription }),
      };

      console.log("Creating payment with data:", paymentData);

      let { data, error } = await supabase.functions.invoke('create-payment', {
        body: paymentData,
      });

      console.log("Payment response:", { data, error });

      if (error) {
        console.error("Payment creation error:", error);
        setLoading(false);
        throw new Error(error.message || "Failed to create payment");
      }

      if (!data?.url) {
        setLoading(false);
        throw new Error('No payment URL received from Stripe');
      }

      console.log("About to redirect to:", data.url);
      
      // Immediately redirect to Stripe - this is more reliable than setTimeout
      window.location.href = data.url;
      
    } catch (error: any) {
      console.error("=== PAYMENT ERROR ===", error);
      setLoading(false); // Only set loading to false on error
      toast({
        title: "Payment Error", 
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
};