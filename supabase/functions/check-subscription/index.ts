import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Subscription tier mapping
const TIER_MAPPING: Record<string, { tier: string; features: any }> = {
  'prod_TpPAL2LwSSgyGn': { // RoleColor Pro Monthly
    tier: 'pro_monthly',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: false,
      aiJobMatching: false,
      familyMembers: 0
    }
  },
  'prod_TpPAD76Twqqczt': { // RoleColor Pro Annual
    tier: 'pro_annual',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: false,
      aiJobMatching: false,
      familyMembers: 0
    }
  },
  'prod_TpPAoXkfwqBWWQ': { // Career Growth
    tier: 'career_growth',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: false,
      aiJobMatching: true,
      familyMembers: 0
    }
  },
  'prod_TpPAln2kXtUsPa': { // Annual Premium Pass
    tier: 'annual_pass',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: true,
      aiJobMatching: false,
      familyMembers: 0
    }
  },
  'prod_TpPAmElJFFsMAw': { // Family Plan
    tier: 'family',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: true,
      aiJobMatching: false,
      familyMembers: 5
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      
      // Check if user is a family plan member
      const { data: familyMembership } = await supabaseClient
        .from('family_plan_members')
        .select('owner_user_id, status')
        .eq('member_user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (familyMembership) {
        // Get owner's subscription
        const { data: ownerSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', familyMembership.owner_user_id)
          .eq('status', 'active')
          .single();
        
        if (ownerSub && ownerSub.tier === 'family') {
          logStep("User is family plan member");
          return new Response(JSON.stringify({
            subscribed: true,
            productId: ownerSub.product_id,
            tier: 'family_member',
            subscriptionEnd: ownerSub.current_period_end,
            features: TIER_MAPPING['prod_TpPAmElJFFsMAw']?.features || {}
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: 'free',
        features: {
          unlimitedRetakes: false,
          progressTracking: false,
          allAssessments: false,
          aiJobMatching: false,
          familyMembers: 0
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let tier = 'free';
    let subscriptionEnd = null;
    let features = {
      unlimitedRetakes: false,
      progressTracking: false,
      allAssessments: false,
      aiJobMatching: false,
      familyMembers: 0
    };

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      
      const tierInfo = TIER_MAPPING[productId];
      if (tierInfo) {
        tier = tierInfo.tier;
        features = tierInfo.features;
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, productId, tier, endDate: subscriptionEnd });
      
      // Update local database
      await supabaseClient
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          product_id: productId,
          price_id: subscription.items.data[0].price.id,
          tier: tier,
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
          cancel_at_period_end: subscription.cancel_at_period_end
        }, { onConflict: 'user_id' });
      
    } else {
      logStep("No active subscription found");
      
      // Check for family plan membership
      const { data: familyMembership } = await supabaseClient
        .from('family_plan_members')
        .select('owner_user_id, status')
        .eq('member_user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (familyMembership) {
        const { data: ownerSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', familyMembership.owner_user_id)
          .eq('status', 'active')
          .single();
        
        if (ownerSub && ownerSub.tier === 'family') {
          logStep("User is family plan member");
          return new Response(JSON.stringify({
            subscribed: true,
            productId: ownerSub.product_id,
            tier: 'family_member',
            subscriptionEnd: ownerSub.current_period_end,
            features: TIER_MAPPING['prod_TpPAmElJFFsMAw']?.features || {}
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      productId,
      tier,
      subscriptionEnd,
      features
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
