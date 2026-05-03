import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RcaiDiscountState = {
  loading: boolean;
  eligible: boolean;
  discountPct: number;
  consumedAt: string | null;
  reason?: string;
};

/**
 * Server-side check for the one-time RoleColorAI 50% member discount.
 * Never trust this for pricing — the edge function re-checks atomically.
 * Use only to drive UI (cart strikethrough, banner text).
 */
export function useRcaiDiscount(productType?: "premium" | "pro" | "career" | "team") {
  const { user } = useAuth();
  const [state, setState] = useState<RcaiDiscountState>({
    loading: !!user,
    eligible: false,
    discountPct: 0,
    consumedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setState({ loading: false, eligible: false, discountPct: 0, consumedAt: null });
      return;
    }
    (async () => {
      try {
        const qs = productType ? `?productType=${productType}` : "";
        const { data, error } = await supabase.functions.invoke(`check-rcai-discount${qs}`, {
          method: "GET",
        });
        if (cancelled) return;
        if (error || !data) {
          setState({ loading: false, eligible: false, discountPct: 0, consumedAt: null, reason: error?.message });
          return;
        }
        setState({
          loading: false,
          eligible: !!data.eligible,
          discountPct: data.discountPct ?? 0,
          consumedAt: data.consumedAt ?? null,
          reason: data.reason,
        });
      } catch (err) {
        if (cancelled) return;
        setState({ loading: false, eligible: false, discountPct: 0, consumedAt: null, reason: (err as Error).message });
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, productType]);

  return state;
}