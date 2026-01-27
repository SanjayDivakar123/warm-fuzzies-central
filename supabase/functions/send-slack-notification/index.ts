import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SlackNotificationRequest {
  company_id: string;
  event_type: "assessment_completed" | "new_employee" | "reminder" | "task_assigned";
  data: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { company_id, event_type, data }: SlackNotificationRequest = await req.json();

    if (!company_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: company_id, event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company settings
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, slack_notifications_enabled, slack_channel_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company.slack_notifications_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: "Slack notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Slack message based on event type
    let message = "";
    let blocks: any[] = [];

    switch (event_type) {
      case "assessment_completed":
        message = `🎉 ${data.employee_name || data.email} completed their RoleColor assessment!`;
        blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Assessment Completed* 🎉\n${data.employee_name || data.email} has completed their RoleColor assessment.`
            }
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Primary Color:*\n${data.dominant_color || "N/A"}` },
              { type: "mrkdwn", text: `*Secondary Color:*\n${data.secondary_color || "N/A"}` }
            ]
          }
        ];
        break;

      case "new_employee":
        message = `👋 ${data.employee_name || data.email} has joined ${company.name}!`;
        blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*New Team Member* 👋\n${data.employee_name || data.email} has joined the team.`
            }
          }
        ];
        break;

      case "task_assigned":
        message = `📋 New task assigned: ${data.task_title}`;
        blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Task Assigned* 📋\n*${data.task_title}*`
            }
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Assignee:*\n${data.assignee_name || data.assignee_email}` },
              { type: "mrkdwn", text: `*Priority:*\n${data.priority || "Normal"}` }
            ]
          }
        ];
        break;

      case "reminder":
        message = `⏰ Reminder: ${data.message}`;
        blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Reminder* ⏰\n${data.message}`
            }
          }
        ];
        break;

      default:
        message = `📢 Notification from ${company.name}`;
    }

    // For now, log the notification (actual Slack webhook would go here)
    // In production, you'd use the Slack connector or webhook URL
    console.log("Slack notification prepared:", { 
      company_id, 
      event_type, 
      message, 
      channel: company.slack_channel_id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Slack notification queued",
        notification: { event_type, message }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
