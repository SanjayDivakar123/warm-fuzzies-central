import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      company_id, 
      email, 
      full_name, 
      position_title,
      ideal_role_color,
      assessment_category,
      assessment_type,
      notes
    } = await req.json();

    if (!company_id || !email) {
      return new Response(
        JSON.stringify({ error: "company_id and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if candidate already exists
    const { data: existing } = await supabase
      .from("candidates")
      .select("id")
      .eq("company_id", company_id)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This candidate has already been invited" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, subdomain, subdomain_enabled, subdomain_status, primary_color")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      console.error("Company not found:", companyError);
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create candidate record
    const { data: candidate, error: insertError } = await supabase
      .from("candidates")
      .insert({
        company_id,
        email: email.toLowerCase(),
        full_name,
        position_title,
        ideal_role_color: ideal_role_color === 'any' ? null : ideal_role_color,
        assessment_category,
        assessment_type,
        notes,
        status: "invited",
        source: "invite",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create candidate:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create candidate" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate portal URL (always use path-based)
    const portalUrl = `https://rolecolorfinder.com/company/${company.subdomain}`;

    const candidateUrl = `${portalUrl}/candidate/${candidate.invite_code}`;

    // Send invitation email via Mailgun
    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

    if (mailgunApiKey) {
      const primaryColor = company.primary_color || "#9b87f5";
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${company.name}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px;">You're Invited to Take an Assessment</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Hi${full_name ? ` ${full_name}` : ''},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        ${company.name} has invited you to complete a RoleColor assessment${position_title ? ` for the <strong>${position_title}</strong> position` : ''}.
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                        This assessment helps identify your natural work style and behavioral preferences.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${candidateUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Take Assessment
                        </a>
                      </div>
                      <p style="color: #999999; font-size: 14px; text-align: center; margin: 30px 0 0;">
                        Your access code: <strong>${candidate.invite_code}</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        Powered by <a href="https://rolecolorfinder.com" style="color: ${primaryColor}; text-decoration: none;">RoleColorFinder</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const formData = new FormData();
      formData.append("from", `${company.name} <no-reply@${mailgunDomain}>`);
      formData.append("to", email);
      formData.append("subject", `${company.name} - Assessment Invitation`);
      formData.append("html", htmlContent);

      try {
        const mailgunResponse = await fetch(
          `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
            },
            body: formData,
          }
        );

        if (!mailgunResponse.ok) {
          const errorText = await mailgunResponse.text();
          console.error("Mailgun error:", errorText);
        } else {
          console.log("Invitation email sent successfully");
        }
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate,
        candidateUrl
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in invite-candidate:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});