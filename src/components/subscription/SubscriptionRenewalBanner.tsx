import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDaysUntilExpiry, isSubscriptionExpiringSoon } from "@/lib/subscriptionAccess";

interface SubscriptionRenewalBannerProps {
  subscriptionEnd: string | null;
}

export function SubscriptionRenewalBanner({ subscriptionEnd }: SubscriptionRenewalBannerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const subscription = {
    isSubscribed: true,
    tier: '',
    productId: null,
    subscriptionEnd,
    features: {
      unlimitedRetakes: false,
      progressTracking: false,
      allAssessments: false,
      aiJobMatching: false,
      familyMembers: 0
    }
  };

  const expiringSoon = isSubscriptionExpiringSoon(subscription);
  const daysLeft = getDaysUntilExpiry(subscription);

  if (!expiringSoon || daysLeft === null) return null;

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (!data?.url) throw new Error("No portal URL returned");
      window.open(data.url, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription portal.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
      <Clock className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        Subscription Renewing Soon
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between mt-2">
        <span className="text-yellow-700 dark:text-yellow-300">
          Your subscription will renew in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManageSubscription}
          disabled={loading}
          className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Manage
              <ExternalLink className="w-3 h-3 ml-1" />
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
