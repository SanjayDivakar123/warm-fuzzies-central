import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SubscriptionTier } from "@/lib/subscriptionTiers";

interface SubscriptionCheckoutButtonProps {
  tier: SubscriptionTier;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SubscriptionCheckoutButton({
  tier,
  children,
  className,
  variant = "default",
  size = "default"
}: SubscriptionCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          priceId: tier.priceId,
          successUrl: `${window.location.origin}/subscription-success?tier=${tier.id}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Subscription checkout error:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleCheckout}
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
}
