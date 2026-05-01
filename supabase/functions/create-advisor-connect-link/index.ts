import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireSuperAdmin } from "../_shared/admin.ts";
import {
  advisorCorsHeaders,
  createServiceClient,
  getAdvisorForAuthUser,
  getOrigin,
  jsonResponse,
} from "../_shared/advisorLanding.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = await req.json();
    const supabase = createServiceClient();
    let advisorId = body.advisorId ? String(body.advisorId) : "";
    let actor = "advisor";

    if (!advisorId) {
      const advisorContext = await getAdvisorForAuthUser(req, supabase);
      advisorId = advisorContext.advisor.id;
    } else {
      await requireSuperAdmin(req);
      actor = "super_admin";
    }

    const { data: advisor, error: advisorError } = await supabase
      .from("advisors")
      .select("*")
      .eq("id", advisorId)
      .single();

    if (advisorError) throw advisorError;

    await supabase
      .from("advisors")
      .update({
        stripe_connect_account_type: "standard",
        stripe_connect_status: advisor.stripe_connect_account_id ? advisor.stripe_connect_status : "oauth_pending",
      })
      .eq("id", advisor.id);

    const origin = getOrigin(req);
    const returnUrl = String(body.returnUrl || `${origin}/advisor-portal?connect=return`);
    const connectClientId = Deno.env.get("STRIPE_CONNECT_CLIENT_ID");

    if (!connectClientId) {
      return jsonResponse(400, {
        error: "Missing STRIPE_CONNECT_CLIENT_ID. Standard Stripe Connect requires the platform Connect OAuth client ID from Stripe Connect settings.",
      });
    }

    const state = encodeURIComponent(advisor.id);
    const redirectUri = encodeURIComponent(returnUrl);
    const url =
      `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(connectClientId)}` +
      `&scope=read_write&state=${state}&redirect_uri=${redirectUri}&stripe_user[email]=${encodeURIComponent(advisor.email)}` +
      `&stripe_user[business_name]=${encodeURIComponent(advisor.company_name || advisor.name)}`;

    return jsonResponse(200, {
      url,
      accountId: advisor.stripe_connect_account_id ?? null,
      actor,
      status: {
        chargesEnabled: Boolean(advisor.charges_enabled),
        payoutsEnabled: Boolean(advisor.payouts_enabled),
        detailsSubmitted: Boolean(advisor.details_submitted),
      },
    });
  } catch (error) {
    console.error("create-advisor-connect-link error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse(status, { error: message });
  }
});
