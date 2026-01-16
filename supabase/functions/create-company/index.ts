import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return typeof email === 'string' && email.length <= 255 && emailRegex.test(email)
}

function isValidSubdomain(subdomain: string): boolean {
  // Lowercase alphanumeric + hyphens, 3-63 chars, no reserved words
  const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
  const reserved = ['www', 'api', 'admin', 'app', 'dashboard', 'mail', 'ftp', 'localhost', 'supabase']
  return typeof subdomain === 'string' && 
    subdomainRegex.test(subdomain) && 
    !reserved.includes(subdomain)
}

function sanitizeString(str: string, maxLength: number): string {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLength)
}

function isValidAssessmentType(type: string): boolean {
  return ['25q', '50q'].includes(type)
}

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Please sign in to create a company' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Session expired. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, user.email);

    const body = await req.json();
    let { name, subdomain, admin_email, seats_purchased, assessment_type } = body;

    // Input validation
    name = sanitizeString(name || '', 100);
    subdomain = (subdomain || '').toLowerCase().trim();
    admin_email = (admin_email || '').toLowerCase().trim();

    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Company name must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidSubdomain(subdomain)) {
      return new Response(
        JSON.stringify({ error: 'Invalid subdomain format. Use 3-63 lowercase letters, numbers, and hyphens.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(admin_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate seats
    if (typeof seats_purchased !== 'number' || seats_purchased < 2 || seats_purchased > 10000) {
      return new Response(
        JSON.stringify({ error: 'Seats must be between 2 and 10,000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate assessment type
    if (!isValidAssessmentType(assessment_type)) {
      assessment_type = '25q'; // Default
    }

    console.log('Creating company:', { name, subdomain, admin_email, user_id: user.id });

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Generate invite code for admin
    const inviteCode = generateInviteCode();

    // Create admin user linked to the authenticated user
    const { data: adminUser, error: adminUserError } = await supabase
      .from('company_users')
      .insert({
        company_id: company.id,
        email: admin_email,
        user_id: user.id,
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString(),
        invite_code: inviteCode,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (adminUserError) {
      console.error('Error creating admin user:', adminUserError);
      throw adminUserError;
    }

    console.log('Admin user created:', adminUser.id, 'with invite code:', inviteCode);

    return new Response(
      JSON.stringify({ company, adminUser }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
