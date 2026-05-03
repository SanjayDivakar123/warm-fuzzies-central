import { useEffect, useState } from "react";
import { Gift, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RcaiRedeemDialog } from "@/components/payment/RcaiRedeemDialog";

type DiscountStatus = {
  eligible: boolean | null;
  status: string | null;
  plan: string | null;
};

/**
 * Reads the shared `rolecolorai_discount_status` view.
 * - eligible=true   → render the redeem banner
 * - status=consumed → render a passive "already used" note
 * - otherwise       → render nothing
 */
export function RcaiDiscountBanner() {
  const { user } = useAuth();
  const [data, setData] = useState<DiscountStatus | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("rolecolorai_discount_status")
        .select("eligible, status, plan")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("[RcaiDiscountBanner] view lookup failed:", error.message);
        return;
      }
      setData(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!data) return null;

  if (data.eligible === true) {
    const planLabel = data.plan ? ` ${data.plan}` : "";
    return (
      <>
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">🎁 You have 50% off waiting!</p>
              <p className="text-sm text-muted-foreground">
                Your RoleColorAI{planLabel} subscription unlocks one free 50% off RoleColorFinder assessment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Redeem now →
          </button>
        </div>
        <RcaiRedeemDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      </>
    );
  }

  if (data.status === "consumed") {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        You've used your RoleColorAI member discount.
      </div>
    );
  }

  return null;
}

export default RcaiDiscountBanner;