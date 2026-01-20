import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INVITE-FAMILY-MEMBER] ${step}${detailsStr}`);
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

    const { memberEmail } = await req.json();
    if (!memberEmail) {
      throw new Error("memberEmail is required");
    }
    logStep("Request params", { memberEmail });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user has family plan subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('tier', 'family')
      .single();

    if (subError || !subscription) {
      throw new Error("You must have an active Family Plan subscription to invite members");
    }
    logStep("Family subscription verified", { subscriptionId: subscription.id });

    // Check current member count
    const { data: members, error: membersError } = await supabaseClient
      .from('family_plan_members')
      .select('id')
      .eq('owner_user_id', user.id)
      .in('status', ['pending', 'active']);

    if (membersError) throw new Error("Failed to check member count");

    const memberCount = members?.length || 0;
    if (memberCount >= 5) {
      throw new Error("You have reached the maximum of 5 family members");
    }
    logStep("Member count check passed", { currentCount: memberCount });

    // Check if email already invited
    const { data: existing } = await supabaseClient
      .from('family_plan_members')
      .select('id, status')
      .eq('owner_user_id', user.id)
      .eq('member_email', memberEmail.toLowerCase())
      .single();

    if (existing) {
      throw new Error(`This email is already ${existing.status === 'active' ? 'a member' : 'invited'}`);
    }

    // Check if the member email has a Supabase account
    const { data: memberUser } = await supabaseClient.auth.admin.listUsers();
    const existingMember = memberUser?.users?.find(u => u.email?.toLowerCase() === memberEmail.toLowerCase());

    // Insert invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('family_plan_members')
      .insert({
        owner_user_id: user.id,
        member_email: memberEmail.toLowerCase(),
        member_user_id: existingMember?.id || null,
        status: existingMember ? 'active' : 'pending',
        joined_at: existingMember ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (inviteError) throw new Error(`Failed to create invitation: ${inviteError.message}`);
    logStep("Invitation created", { invitationId: invitation.id, status: invitation.status });

    // TODO: Send invitation email if member doesn't exist

    return new Response(JSON.stringify({ 
      success: true, 
      invitation,
      message: existingMember 
        ? "Member added successfully" 
        : "Invitation sent. They will be added when they create an account."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
