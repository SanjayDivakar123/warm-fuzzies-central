import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, ExternalLink, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getTierById, SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";

interface SubscriptionStatusProps {
  tier: string;
  subscriptionEnd: string | null;
  onRefresh?: () => void;
}

export function SubscriptionStatus({ tier, subscriptionEnd, onRefresh }: SubscriptionStatusProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  const tierInfo = getTierById(tier) || Object.values(SUBSCRIPTION_TIERS).find(t => t.id === tier);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (!data?.url) throw new Error("No portal URL returned");

      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription portal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (tier === 'free' || !tier) {
    return null;
  }

  return (
    <Card className="shadow-elegant border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Active Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="bg-primary/10 text-primary border-primary/30 mb-2">
              {tierInfo?.name || tier}
            </Badge>
            {subscriptionEnd && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Renews {format(new Date(subscriptionEnd), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageSubscription}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Manage
                <ExternalLink className="w-3 h-3 ml-1" />
              </>
            )}
          </Button>
        </div>

        {tierInfo && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium mb-2">Your Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {tierInfo.features.unlimitedRetakes && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Unlimited assessment retakes
                </li>
              )}
              {tierInfo.features.progressTracking && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Progress tracking dashboard
                </li>
              )}
              {tierInfo.features.allAssessments && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  All assessments unlocked
                </li>
              )}
              {tierInfo.features.aiJobMatching && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  AI job matching & coaching
                </li>
              )}
              {tierInfo.features.familyMembers > 0 && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Up to {tierInfo.features.familyMembers} family members
                </li>
              )}
            </ul>
          </div>
        )}

        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="w-full">
            Refresh Status
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
