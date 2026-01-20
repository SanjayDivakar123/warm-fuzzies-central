import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, Crown, Users, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SubscriptionTier, getFeatureLabel } from "@/lib/subscriptionTiers";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  tier: SubscriptionTier;
  currentTier?: string;
  isActive?: boolean;
}

const tierIcons: Record<string, React.ElementType> = {
  pro_monthly: Sparkles,
  pro_annual: Sparkles,
  career_growth: Briefcase,
  annual_pass: Crown,
  family: Users
};

export function SubscriptionCard({ tier, currentTier, isActive }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const Icon = tierIcons[tier.id] || Sparkles;
  const isCurrentPlan = currentTier === tier.id;

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to subscribe",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { priceId: tier.priceId }
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const featureList = [
    tier.features.unlimitedRetakes && getFeatureLabel('unlimitedRetakes'),
    tier.features.progressTracking && getFeatureLabel('progressTracking'),
    tier.features.allAssessments && getFeatureLabel('allAssessments'),
    tier.features.aiJobMatching && getFeatureLabel('aiJobMatching'),
    tier.features.familyMembers > 0 && `Up to ${tier.features.familyMembers} family members`
  ].filter(Boolean);

  return (
    <div className={cn(
      "relative flex-1 overflow-hidden rounded-xl bg-muted/40 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 group",
      isCurrentPlan && "ring-2 ring-primary",
      tier.popular && "border-2 border-primary/30"
    )}>
      {tier.popular && (
        <Badge className="absolute top-3 right-3 rounded-full">
          Most Popular
        </Badge>
      )}
      {tier.badge && !tier.popular && (
        <Badge variant="secondary" className="absolute top-3 right-3 rounded-full">
          {tier.badge}
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge variant="outline" className="absolute top-3 left-3 rounded-full border-primary text-primary">
          Your Plan
        </Badge>
      )}

      <div className="relative z-10 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground">{tier.name}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-muted-foreground">$</span>
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {tier.price}
            </span>
            <span className="text-muted-foreground">/{tier.interval}</span>
          </div>
        </div>

        <ul className="space-y-2 mb-6">
          {featureList.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full rounded-full"
          variant={tier.popular ? "default" : "outline"}
          onClick={handleSubscribe}
          disabled={loading || isCurrentPlan}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : (
            "Subscribe Now"
          )}
        </Button>
      </div>
    </div>
  );
}
