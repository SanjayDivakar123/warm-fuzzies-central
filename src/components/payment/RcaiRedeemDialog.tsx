import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedPrice } from "@/lib/countryPricing";

type Assessment = "premium" | "pro";

const ASSESSMENTS: Array<{
  type: Assessment;
  title: string;
  basePriceUsd: number;
  blurb: string;
  perks: string[];
}> = [
  {
    type: "premium",
    title: "Premium Assessment",
    basePriceUsd: 124.99,
    blurb: "Full RoleColor profile with personalized insights.",
    perks: ["Detailed RoleColor profile", "Strengths & growth report", "PDF export"],
  },
  {
    type: "pro",
    title: "Pro Assessment",
    basePriceUsd: 199.99,
    blurb: "Premium plus career & leadership deep-dive.",
    perks: ["Everything in Premium", "Career fit analysis", "Leadership insights"],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * RoleColorAI member redeem flow:
 * 1. User picks Premium or Pro (50% off shown).
 * 2. We call create-payment which server-side re-checks eligibility via the
 *    shared rolecolorai_discount_status view, then issues a Stripe Checkout URL.
 * 3. Redirect immediately. On payment-success, the assessment becomes available.
 */
export function RcaiRedeemDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState<Assessment | null>(null);

  const startCheckout = async (type: Assessment) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      setLoadingType(type);
      const successUrl = `${window.location.origin}/payment-success?type=${type}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/dashboard`;
      const usdPricing = getLocalizedPrice(type);

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          productType: type,
          successUrl,
          cancelUrl,
          ...(usdPricing && {
            stripeCurrency: usdPricing.stripeCurrency,
            stripeAmountMinor: usdPricing.stripeAmountMinor,
            displayCurrency: usdPricing.displayCurrency,
            displayAmount: usdPricing.displayAmount,
            billingCountry: usdPricing.country,
          }),
        },
      });

      if (error) throw new Error(error.message || "Failed to create payment");
      if (!data?.url) throw new Error("No payment URL received from Stripe");

      window.location.href = data.url;
    } catch (err: any) {
      console.error("RcaiRedeemDialog checkout error:", err);
      setLoadingType(null);
      toast({
        title: "Payment Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loadingType) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Pick your assessment — 50% off applied
          </DialogTitle>
          <DialogDescription>
            Your RoleColorAI member discount is automatically applied at checkout.
            After payment you'll be taken straight into your assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 mt-2">
          {ASSESSMENTS.map((a) => {
            const discounted = +(a.basePriceUsd * 0.5).toFixed(2);
            const isLoading = loadingType === a.type;
            return (
              <div
                key={a.type}
                className="rounded-xl border border-border p-4 flex flex-col bg-card"
              >
                <h3 className="font-semibold text-lg">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{a.blurb}</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">${discounted.toFixed(2)}</span>
                  <span className="text-sm line-through text-muted-foreground">
                    ${a.basePriceUsd.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium text-green-600">50% off</span>
                </div>

                <ul className="mt-3 space-y-1 text-sm flex-1">
                  {a.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-4 w-full"
                  onClick={() => startCheckout(a.type)}
                  disabled={loadingType !== null}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting to Stripe…
                    </>
                  ) : (
                    <>Choose {a.title.split(" ")[0]} →</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RcaiRedeemDialog;