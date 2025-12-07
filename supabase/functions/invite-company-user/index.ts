import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendInviteEmail(
  email: string, 
  inviteCode: string, 
  companyName: string,
  subdomain: string
) {
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
  
  if (!sendgridApiKey) {
    console.error('SENDGRID_API_KEY not configured');
    return false;
  }

  const portalUrl = `https://preview--role-color-finder.lovable.app/company/${subdomain}/login`;
  
  const emailContent = {
    personalizations: [
      {
        to: [{ email }],
        subject: `You're invited to take the Role Color Assessment for ${companyName}`,
      },
    ],
    from: {
      email: 'noreply@rolecolorfinder.com',
      name: 'Role Color Finder',
    },
    content: [
      {
        type: 'text/html',
        value: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Role Color Finder</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #333; margin-top: 0;">You've been invited!</h2>
              
              <p>Hi there,</p>
              
              <p><strong>${companyName}</strong> has invited you to take the Role Color Assessment. This assessment will help identify your work style and how you collaborate best with your team.</p>
              
              <div style="background: white; border: 2px dashed #9b87f5; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Invite Code</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #9b87f5;">${inviteCode}</p>
              </div>
              
              <p style="text-align: center;">
                <a href="${portalUrl}" style="display: inline-block; background: #9b87f5; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600;">Start Assessment</a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Or go directly to: <a href="${portalUrl}" style="color: #9b87f5;">${portalUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This invitation was sent by ${companyName} through Role Color Finder.<br>
                If you didn't expect this email, you can safely ignore it.
              </p>
            </div>
          </body>
          </html>
        `,
      },
    ],
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
      return false;
    }

    console.log('Invite email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

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

    // Get company details including name and subdomain
    const { data: company } = await supabase
      .from('companies')
      .select('seats_purchased, name, subdomain')
      .eq('id', company_id)
      .single();

    if (!company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check seats available
    const { data: activeUsers } = await supabase
      .from('company_users')
      .select('id')
      .eq('company_id', company_id)
      .neq('status', 'revoked');

    if (activeUsers && activeUsers.length >= company.seats_purchased) {
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

    // Send invitation email
    const emailSent = await sendInviteEmail(
      email, 
      inviteCode, 
      company.name,
      company.subdomain
    );

    return new Response(
      JSON.stringify({ user, emailSent }),
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
