import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Company ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user?.id || !user.email) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email.toLowerCase().trim();
    console.log(`Verifying Google SSO for user ${userEmail} in company ${companyId}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Company not found:', companyError);
      return new Response(
        JSON.stringify({ success: false, message: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if Google SSO is enabled
    if (!company.google_sso_enabled) {
      console.log('Google SSO not enabled for this company');
      return new Response(
        JSON.stringify({ success: false, message: 'Google SSO is not enabled for this company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validate domain if configured
    const emailDomain = userEmail.split('@')[1]?.toLowerCase();
    if (company.google_workspace_domain) {
      const requiredDomain = company.google_workspace_domain.toLowerCase();
      if (emailDomain !== requiredDomain) {
        console.log(`Domain mismatch: ${emailDomain} vs ${requiredDomain}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Only @${company.google_workspace_domain} email addresses are allowed` 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Check for existing employee
    const { data: existingEmployee, error: existingError } = await supabase
      .from('company_users')
      .select('*')
      .eq('company_id', companyId)
      .eq('email', userEmail.toLowerCase())
      .maybeSingle();

    if (existingEmployee) {
      console.log('Existing employee found:', existingEmployee.id);

      if (existingEmployee.status === 'revoked') {
        return new Response(
          JSON.stringify({ success: false, message: 'Your access has been revoked. Please contact your administrator.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Link the authenticated account and activate pending invite records.
      if (!existingEmployee.user_id || existingEmployee.status !== 'active') {
        const { error: updateError } = await supabase
          .from('company_users')
          .update({ 
            user_id: userId, 
            status: 'active',
            joined_at: existingEmployee.joined_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEmployee.id);

        if (updateError) {
          console.error('Error updating employee:', updateError);
          return new Response(
            JSON.stringify({ success: false, message: 'Unable to activate employee access' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Return the employee with potentially updated user_id
      const updatedEmployee = {
        ...existingEmployee,
        user_id: userId,
        status: 'active',
        joined_at: existingEmployee.joined_at || new Date().toISOString(),
      };
      return new Response(
        JSON.stringify({ 
          success: true, 
          employee: updatedEmployee,
          isNewEmployee: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. No existing employee - check seat availability
    const { count: activeCount, error: countError } = await supabase
      .from('company_users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('status', ['active', 'invited']);

    if (countError) {
      console.error('Error counting employees:', countError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error checking seat availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentCount = activeCount || 0;
    console.log(`Current employee count: ${currentCount}, seats purchased: ${company.seats_purchased}`);

    if (currentCount >= company.seats_purchased) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No seats available. Please contact your administrator.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Charge for the new seat (call charge-invite function)
    // Special case: Skip charging for RoleColorFinderLLC (demo/unlimited company)
    const skipCharge = company.name === 'RoleColorFinderLLC';
    
    if (!skipCharge) {
      console.log('Charging for new seat...');
      try {
        const chargeResponse = await fetch(`${supabaseUrl}/functions/v1/charge-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ company_id: companyId }),
        });

        const chargeResult = await chargeResponse.json();
        console.log('Charge result:', chargeResult);

        if (!chargeResult.success) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: chargeResult.message || 'Payment required. Please contact your administrator.',
              requiresPayment: true
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (chargeError) {
        console.error('Charge error:', chargeError);
        // Continue without charging if charge-invite fails (company might have credits or be exempt)
      }
    }

    // 7. Generate invite code for the new employee
    const { data: inviteCode } = await supabase.rpc('generate_invite_code');

    // 8. Create new employee
    const { data: newEmployee, error: createError } = await supabase
      .from('company_users')
      .insert({
        company_id: companyId,
        email: userEmail.toLowerCase(),
        user_id: userId,
        role: 'employee',
        status: 'active',
        invite_code: inviteCode,
        joined_at: new Date().toISOString(),
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating employee:', createError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create employee record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('New employee created:', newEmployee.id);

    // 9. Notify admins about the new employee (fire and forget)
    try {
      fetch(`${supabaseUrl}/functions/v1/notify-admin-new-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ 
          companyId, 
          employeeEmail: userEmail.toLowerCase() 
        }),
      }).catch(err => console.error('Failed to send admin notification:', err));
    } catch (notifyError) {
      console.error('Error triggering admin notification:', notifyError);
      // Don't fail the main request if notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        employee: newEmployee,
        isNewEmployee: true,
        message: 'Welcome! Your account has been created.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ success: false, message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
