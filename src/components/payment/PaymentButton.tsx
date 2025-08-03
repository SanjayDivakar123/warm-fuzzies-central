import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface PaymentButtonProps {
  productType: "premium" | "pro";
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const PaymentButton = ({ 
  productType, 
  children, 
  className,
  variant = "default",
  size = "default"
}: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePayment = async () => {
    console.log("Payment button clicked for:", productType);

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
      
      console.log("Making request to create-payment with:", {
        productType,
        successUrl: `${window.location.origin}/payment-success?type=${productType}`,
        cancelUrl: `${window.location.origin}/pricing`
      });
      
      // Create payment session - Stripe will redirect to success page
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          productType,
          successUrl: `${window.location.origin}/payment-success?type=${productType}`,
          cancelUrl: `${window.location.origin}/pricing`
        }
      });

      console.log("Response from edge function:", { data, error });

      if (error) {
        console.error("Edge function error details:", error);
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in same tab so it can redirect properly
        window.location.href = data.url;
        
        toast({
          title: "Redirecting to payment",
          description: "You'll be able to access your assessment after payment...",
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          Creating payment...
        </>
      ) : (
        children
      )}
    </Button>
  );
};