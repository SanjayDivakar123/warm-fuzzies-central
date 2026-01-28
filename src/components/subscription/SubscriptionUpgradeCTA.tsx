import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";

export function SubscriptionUpgradeCTA() {
  const proMonthly = SUBSCRIPTION_TIERS.pro_monthly;

  return (
    <Card className="shadow-elegant border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Upgrade to Pro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Unlock unlimited retakes, progress tracking, and more with a subscription.
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary" />
            <span>Unlimited assessment retakes</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary" />
            <span>Progress tracking dashboard</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary" />
            <span>See how your results change over time</span>
          </div>
        </div>

        <div className="flex items-baseline gap-1 pt-2">
          <span className="text-2xl font-bold">${proMonthly.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>

        <Button asChild className="w-full">
          <Link to="/pricing">
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
