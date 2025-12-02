import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id, email } = await req.json();

    console.log('Inviting user:', { company_id, email });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('company_users')
      .select('id')
      .eq('company_id', company_id)
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User already invited' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check seats available
    const { data: company } = await supabase
      .from('companies')
      .select('seats_purchased')
      .eq('id', company_id)
      .single();

    const { data: activeUsers } = await supabase
      .from('company_users')
      .select('id')
      .eq('company_id', company_id)
      .neq('status', 'revoked');

    if (activeUsers && company && activeUsers.length >= company.seats_purchased) {
      return new Response(
        JSON.stringify({ error: 'No seats available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate invite code
    const { data: inviteCodeData } = await supabase.rpc('generate_invite_code');
    const inviteCode = inviteCodeData;

    // Create user invite
    const { data: user, error: userError } = await supabase
      .from('company_users')
      .insert({
        company_id,
        email,
        role: 'employee',
        status: 'invited',
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user invite:', userError);
      throw userError;
    }

    console.log('User invited:', user.id);

    // TODO: Send invitation email

    return new Response(
      JSON.stringify({ user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
