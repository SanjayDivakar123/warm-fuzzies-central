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

    const { name, subdomain, admin_email, seats_purchased, assessment_type } = await req.json();

    console.log('Creating company:', { name, subdomain, admin_email });

    // Check if subdomain is already taken
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (existingCompany) {
      return new Response(
        JSON.stringify({ error: 'Subdomain already taken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        subdomain,
        admin_email,
        seats_purchased,
        assessment_type,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      throw companyError;
    }

    console.log('Company created:', company.id);

    // Generate invite code
    const { data: inviteCodeData } = await supabase.rpc('generate_invite_code');
    const inviteCode = inviteCodeData;

    // Create admin user
    const { data: adminUser, error: adminUserError } = await supabase
      .from('company_users')
      .insert({
        company_id: company.id,
        email: admin_email,
        role: 'admin',
        status: 'invited',
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (adminUserError) {
      console.error('Error creating admin user:', adminUserError);
      throw adminUserError;
    }

    console.log('Admin user created:', adminUser.id);

    // TODO: Send invitation email to admin

    return new Response(
      JSON.stringify({ company, adminUser }),
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
