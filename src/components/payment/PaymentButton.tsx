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
      
      const paymentData = {
        productType,
        successUrl: `${window.location.origin}/payment-success?type=${productType}`,
        cancelUrl: `${window.location.origin}/pricing`
      };
      
      console.log("Creating payment with data:", paymentData);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: paymentData
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
      
      // Don't set loading to false here since we're redirecting
      toast({
        title: "Redirecting to Stripe...",
        description: "Opening payment page",
      });
      
      // Small delay to ensure toast shows, then redirect
      setTimeout(() => {
        console.log("Executing redirect to:", data.url);
        window.location.href = data.url;
      }, 500);
      
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