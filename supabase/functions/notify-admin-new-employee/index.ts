import React from 'npm:react@18.3.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inline email template
const NewEmployeeNotificationEmail = ({
  adminName,
  employeeEmail,
  companyName,
}: {
  adminName: string;
  employeeEmail: string;
  companyName: string;
}) => React.createElement(Html, null,
  React.createElement(Head, null),
  React.createElement(Preview, null, `New team member joined ${companyName} via Google SSO`),
  React.createElement(Body, { style: { backgroundColor: '#f6f9fc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" } },
    React.createElement(Container, { style: { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', borderRadius: '8px', maxWidth: '600px' } },
      React.createElement(Heading, { style: { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', marginBottom: '24px' } }, 'New Team Member Joined'),
      React.createElement(Text, { style: { color: '#484848', fontSize: '16px', margin: '16px 0' } }, `Hi ${adminName || 'Admin'},`),
      React.createElement(Text, { style: { color: '#484848', fontSize: '16px', margin: '16px 0' } },
        'A new team member has joined ',
        React.createElement('strong', null, companyName),
        ' via Google SSO:'
      ),
      React.createElement(Section, { style: { backgroundColor: '#f0f7ff', borderRadius: '8px', padding: '16px 20px', margin: '24px 0', borderLeft: '4px solid #3b82f6' } },
        React.createElement(Text, { style: { color: '#1a1a1a', fontSize: '14px', margin: '8px 0' } },
          React.createElement('strong', null, 'Email: '), employeeEmail
        ),
        React.createElement(Text, { style: { color: '#1a1a1a', fontSize: '14px', margin: '8px 0' } },
          React.createElement('strong', null, 'Joined via: '), 'Google SSO (auto-enrollment)'
        )
      ),
      React.createElement(Text, { style: { color: '#484848', fontSize: '16px', margin: '16px 0' } },
        'They will now be able to take the Role Color assessment. You can view and manage team members in your admin dashboard.'
      ),
      React.createElement(Hr, { style: { borderColor: '#e6e6e6', margin: '32px 0 16px' } }),
      React.createElement(Text, { style: { color: '#898989', fontSize: '12px' } },
        `This notification was sent because Google SSO auto-enrollment is enabled for ${companyName}. You can manage SSO settings in your company dashboard.`
      )
    )
  )
);

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

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email notification');
      return new Response(
        JSON.stringify({ success: true, message: 'Email notifications not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);

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

    const adminEmails = new Set<string>();
    if (company.admin_email) adminEmails.add(company.admin_email);
    admins?.forEach(admin => adminEmails.add(admin.email));

    if (adminEmails.size === 0) {
      console.log('No admins to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Notifying ${adminEmails.size} admin(s)`);

    const html = await renderAsync(
      React.createElement(NewEmployeeNotificationEmail, {
        adminName: 'Admin',
        employeeEmail,
        companyName: company.name,
      })
    );

    const emailPromises = Array.from(adminEmails).map(adminEmail =>
      resend.emails.send({
        from: 'Role Color Finder <onboarding@resend.dev>',
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
      JSON.stringify({ success: true, message: `Notified ${successCount} admin(s)`, notifiedCount: successCount }),
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
