import React from 'npm:react@18.3.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { NewEmployeeNotificationEmail } from '../send-email/_templates/new-employee-notification.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, employeeEmail } = await req.json();

    if (!companyId || !employeeEmail) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending admin notification for new employee: ${employeeEmail}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if Resend is configured
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email notification');
      return new Response(
        JSON.stringify({ success: true, message: 'Email notifications not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, subdomain, admin_email')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Company not found:', companyError);
      return new Response(
        JSON.stringify({ success: false, message: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all admin users for this company
    const { data: admins, error: adminsError } = await supabase
      .from('company_users')
      .select('email')
      .eq('company_id', companyId)
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error fetching admins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect admin emails (including company.admin_email as fallback)
    const adminEmails = new Set<string>();
    if (company.admin_email) {
      adminEmails.add(company.admin_email);
    }
    admins?.forEach(admin => adminEmails.add(admin.email));

    if (adminEmails.size === 0) {
      console.log('No admins to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Notifying ${adminEmails.size} admin(s)`);

    // Render email template
    const dashboardUrl = `https://rolecolorfinder.lovable.app/company/${company.subdomain}/admin`;
    
    const html = await renderAsync(
      React.createElement(NewEmployeeNotificationEmail, {
        adminName: 'Admin',
        employeeEmail,
        companyName: company.name,
        dashboardUrl,
      })
    );

    // Send to all admins
    const emailPromises = Array.from(adminEmails).map(adminEmail =>
      resend.emails.send({
        from: 'Role Color Finder <notifications@rolecolorfinder.com>',
        to: [adminEmail],
        subject: `New team member joined ${company.name}`,
        html,
      }).catch(err => {
        console.error(`Failed to send to ${adminEmail}:`, err);
        return { error: err };
      })
    );

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => !('error' in r)).length;

    console.log(`Sent ${successCount}/${adminEmails.size} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${successCount} admin(s)`,
        notifiedCount: successCount 
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
