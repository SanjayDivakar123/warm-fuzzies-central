import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const RCAI_DISCOUNT_PCT = 50;

// SKUs eligible for the 50% RoleColorAI member discount.
// Only assessment products — never coaching, add-ons, or subscriptions.
export const RCAI_DISCOUNT_ELIGIBLE_PRODUCTS = new Set(["premium", "pro"]);

export function isRcaiDiscountEligibleProduct(productType: string | null | undefined) {
  return !!productType && RCAI_DISCOUNT_ELIGIBLE_PRODUCTS.has(productType);
}

export function createServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

export type RcaiDiscountStatus =
  | { eligible: true; redemptionId: string; redeemedAt: string | null }
  | { eligible: false; reason: "no_user" | "no_redemption" | "already_consumed" | "no_first_assessment_required"; consumedAt?: string | null };

/**
 * Defense-in-depth eligibility check. Caller is responsible for resolving the user from a bearer token.
 */
export async function checkRcaiDiscount(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string | null,
): Promise<RcaiDiscountStatus> {
  if (!userId) return { eligible: false, reason: "no_user" };

  const { data: redemption, error } = await supabase
    .from("rolecolorai_assessment_discounts")
    .select("id, redeemed_at, consumed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[rcaiDiscount] lookup error:", error);
    return { eligible: false, reason: "no_redemption" };
  }
  if (!redemption) return { eligible: false, reason: "no_redemption" };
  if (redemption.consumed_at) {
    return { eligible: false, reason: "already_consumed", consumedAt: redemption.consumed_at };
  }

  return { eligible: true, redemptionId: redemption.id, redeemedAt: redemption.redeemed_at ?? null };
}

export async function getUserFromAuthHeader(
  supabase: ReturnType<typeof createServiceClient>,
  authHeader: string | null,
) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}