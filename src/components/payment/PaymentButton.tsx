import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { canBypassPayment } from "@/lib/subscriptionAccess";

interface PaymentButtonProps {
  productType: "premium" | "pro" | "team";
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
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false);
  const { toast } = useToast();
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  // Check if user has completed this assessment type before
  useEffect(() => {
    const checkPreviousAssessments = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('assessment_results')
        .select('id')
        .eq('user_id', user.id)
        .eq('assessment_type', productType)
        .limit(1);
      
      setHasCompletedBefore((data?.length ?? 0) > 0);
    };

    checkPreviousAssessments();
  }, [user, productType]);

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

    // Check if subscriber can bypass payment
    if (productType !== 'team' && canBypassPayment(productType, subscription, hasCompletedBefore)) {
      console.log("Subscriber bypass - redirecting directly to assessment");
      toast({
        title: "Subscriber Access",
        description: "Accessing your assessment now...",
      });
      navigate(`/${productType}-assessment`);
      return;
    }

    // Check if subscriber has allAssessments feature (can access even without previous completion)
    if (productType !== 'team' && subscription?.features?.allAssessments) {
      console.log("All assessments unlocked - redirecting directly");
      navigate(`/${productType}-assessment`);
      return;
    }

    try {
      setLoading(true);
      
      const paymentData = {
        productType,
        successUrl: `${window.location.origin}/payment-success?type=${productType}`,
        cancelUrl: `${window.location.origin}/pricing`,
        ...(customAmount && { customAmount }),
        ...(customDescription && { customDescription })
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

  // Show different text for subscribers with bypass access
  const buttonText = () => {
    if (productType !== 'team' && subscription?.features?.allAssessments) {
      return "Start Assessment";
    }
    if (productType !== 'team' && canBypassPayment(productType, subscription, hasCompletedBefore)) {
      return "Retake Assessment";
    }
    return children;
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
        buttonText()
      )}
    </Button>
  );
};