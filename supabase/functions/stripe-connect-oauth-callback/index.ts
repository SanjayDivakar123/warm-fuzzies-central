import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, getOrigin, getStripe } from "../_shared/advisorLanding.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const advisorId = url.searchParams.get("state");
    const origin = getOrigin(req);

    if (!code || !advisorId) {
      return Response.redirect(`${origin}/advisor-portal?connect=missing_code`, 302);
    }

    const stripe = getStripe();
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const connectedAccountId = response.stripe_user_id;
    const account = await stripe.accounts.retrieve(connectedAccountId);
    const supabase = createServiceClient();

    await supabase
      .from("advisors")
      .update({
        stripe_connect_account_id: connectedAccountId,
        stripe_connect_account_type: "standard",
        stripe_connect_status: account.details_submitted
          ? account.charges_enabled && account.payouts_enabled
            ? "ready"
            : "restricted"
          : "connected",
        charges_enabled: Boolean(account.charges_enabled),
        payouts_enabled: Boolean(account.payouts_enabled),
        details_submitted: Boolean(account.details_submitted),
      })
      .eq("id", advisorId);

    return Response.redirect(`${origin}/advisor-portal?connect=success`, 302);
  } catch (error) {
    console.error("stripe-connect-oauth-callback error:", error);
    const origin = getOrigin(req);
    return Response.redirect(`${origin}/advisor-portal?connect=error`, 302);
  }
});
