import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const RCAI_DISCOUNT_PCT = 50;

// SKUs eligible for the 50% RoleColorAI member discount.
// Only assessment products — never coaching, add-ons, or subscriptions.
export const RCAI_DISCOUNT_ELIGIBLE_PRODUCTS = new Set(["premium", "pro"]);

export function isRcaiDiscountEligibleProduct(productType: string | null | undefined) {
  return !!productType && RCAI_DISCOUNT_ELIGIBLE_PRODUCTS.has(productType);
}

export function createServiceClient() {
  // The RoleColorAI discount view + tables live in the SHARED RCAI Supabase
  // project (qbuxoetprodjxpagfkoi), NOT this project's Lovable Cloud backend.
  // We must use dedicated secrets that point at that shared project. The
  // default SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by
  // Lovable Cloud and point at the wrong project — using them silently
  // returns "view not found" and we'd charge full price.
  const url =
    Deno.env.get("RCAI_SUPABASE_URL") ??
    Deno.env.get("SHARED_SUPABASE_URL") ??
    Deno.env.get("SUPABASE_URL") ??
    "";
  const serviceKey =
    Deno.env.get("RCAI_SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SHARED_SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "";
  return createClient(
    url,
    serviceKey,
    { auth: { persistSession: false } },
  );
}

export function createLocalAuthClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(
    url,
    serviceKey,
    { auth: { persistSession: false } },
  );
}

export type RcaiDiscountStatus =
  | { eligible: true; redemptionId: string | null; status: string | null; plan: string | null }
  | { eligible: false; reason: "no_user" | "not_eligible" | "already_consumed" | "lookup_error"; status?: string | null; plan?: string | null };

/**
 * Defense-in-depth eligibility check. Caller is responsible for resolving the user from a bearer token.
 */
/**
 * Source of truth: shared `public.rolecolorai_discount_status` view.
 * Returns eligible=true only when the view says so. Falls back to the underlying
 * redemption row to recover the redemption id (used for downstream consume bookkeeping).
 */
export async function checkRcaiDiscount(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string | null,
): Promise<RcaiDiscountStatus> {
  if (!userId) return { eligible: false, reason: "no_user" };

  const { data, error } = await supabase
    .from("rolecolorai_discount_status")
    .select("eligible, status, plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[rcaiDiscount] view lookup error:", error);
    return { eligible: false, reason: "lookup_error" };
  }
  if (!data) return { eligible: false, reason: "not_eligible" };

  if (data.eligible === true) {
    // Best-effort fetch of redemption id for logging / metadata. Not required for eligibility.
    let redemptionId: string | null = null;
    try {
      const { data: row } = await supabase
        .from("rolecolorai_assessment_discounts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      redemptionId = (row as { id?: string } | null)?.id ?? null;
    } catch (_) { /* ignore */ }
    return { eligible: true, redemptionId, status: data.status ?? null, plan: data.plan ?? null };
  }

  if (data.status === "consumed") {
    return { eligible: false, reason: "already_consumed", status: data.status, plan: data.plan ?? null };
  }
  return { eligible: false, reason: "not_eligible", status: data.status ?? null, plan: data.plan ?? null };
}

export async function getUserFromAuthHeader(
  _supabase: ReturnType<typeof createServiceClient>,
  authHeader: string | null,
) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  // Auth tokens are issued by this app's Lovable Cloud project. The discount
  // data lives in the shared RCAI project, so validate the token locally first
  // and then use the resulting app user id for the shared discount lookup.
  const supabase = createLocalAuthClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}