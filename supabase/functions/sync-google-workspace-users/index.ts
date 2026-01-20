import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName?: string;
    familyName?: string;
  };
  orgUnitPath?: string;
  isAdmin?: boolean;
  suspended?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a manual trigger with specific company ID and access token
    let requestBody: { companyId?: string; accessToken?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body, might be a cron trigger - we'll process all companies with stored tokens
    }

    const { companyId, accessToken } = requestBody;

    // If specific company and token provided, sync that company
    if (companyId && accessToken) {
      const result = await syncCompanyUsers(supabase, companyId, accessToken);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For cron jobs: we can't sync without tokens, just log
    console.log('Sync triggered but no access token provided. Manual sync required for each company.');
    
    return new Response(
      JSON.stringify({ 
        message: 'Google Workspace sync requires manual trigger with access token',
        note: 'Admins must initiate sync from the dashboard with their Google credentials'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-google-workspace-users:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function syncCompanyUsers(supabase: any, companyId: string, accessToken: string) {
  console.log(`Starting Google Workspace sync for company: ${companyId}`);

  // Get company details
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  if (!company.google_sso_enabled) {
    return { 
      success: false, 
      message: 'Google SSO is not enabled for this company',
      updated: 0, 
      added: 0 
    };
  }

  // Fetch users from Google Workspace
  let apiUrl = 'https://admin.googleapis.com/admin/directory/v1/users';
  const params = new URLSearchParams({
    maxResults: '500',
    orderBy: 'email',
  });

  if (company.google_workspace_domain) {
    params.set('domain', company.google_workspace_domain);
  } else {
    params.set('customer', 'my_customer');
  }

  apiUrl += '?' + params.toString();

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google API error:', response.status, errorText);
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  const googleUsers: GoogleUser[] = (data.users || []).filter((u: GoogleUser) => !u.suspended);

  console.log(`Found ${googleUsers.length} active users in Google Workspace`);

  // Get existing company users
  const { data: existingUsers, error: usersError } = await supabase
    .from('company_users')
    .select('id, email, full_name, status')
    .eq('company_id', companyId);

  if (usersError) {
    throw new Error(`Failed to fetch existing users: ${usersError.message}`);
  }

  const existingEmailMap = new Map(
    (existingUsers || []).map((u: any) => [u.email.toLowerCase(), u])
  );

  let updated = 0;
  let synced = 0;

  // Update existing users with latest Google data
  for (const gUser of googleUsers) {
    const email = gUser.primaryEmail.toLowerCase();
    const existingUser = existingEmailMap.get(email);

    if (existingUser && existingUser.status !== 'revoked') {
      // Check if name needs updating
      if (existingUser.full_name !== gUser.name.fullName && gUser.name.fullName) {
        const { error: updateError } = await supabase
          .from('company_users')
          .update({ 
            full_name: gUser.name.fullName,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);

        if (!updateError) {
          updated++;
          console.log(`Updated name for ${email}: ${gUser.name.fullName}`);
        }
      }
      synced++;
    }
  }

  // Check for users that should be marked as revoked (removed from Google)
  const googleEmails = new Set(googleUsers.map(u => u.primaryEmail.toLowerCase()));
  let revoked = 0;

  for (const existingUser of existingUsers || []) {
    if (existingUser.status === 'active' && !googleEmails.has(existingUser.email.toLowerCase())) {
      // User exists in our system but not in Google - mark for review
      console.log(`User ${existingUser.email} not found in Google Workspace - may need review`);
      // Note: We don't auto-revoke to avoid issues with domain restrictions
    }
  }

  const result = {
    success: true,
    message: `Synced ${synced} users from Google Workspace`,
    synced,
    updated,
    totalGoogleUsers: googleUsers.length,
    totalCompanyUsers: existingUsers?.length || 0
  };

  console.log('Sync complete:', result);
  return result;
}
