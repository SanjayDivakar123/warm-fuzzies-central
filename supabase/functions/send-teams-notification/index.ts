import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamsNotificationRequest {
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

    const { company_id, event_type, data }: TeamsNotificationRequest = await req.json();

    if (!company_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: company_id, event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company settings
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, ms_teams_notifications_enabled, ms_teams_webhook_url")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company.ms_teams_notifications_enabled || !company.ms_teams_webhook_url) {
      return new Response(
        JSON.stringify({ success: false, message: "Teams notifications disabled or no webhook configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Teams Adaptive Card based on event type
    let card: any = {
      type: "message",
      attachments: [{
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: []
        }
      }]
    };

    switch (event_type) {
      case "assessment_completed":
        card.attachments[0].content.body = [
          {
            type: "TextBlock",
            size: "large",
            weight: "bolder",
            text: "🎉 Assessment Completed"
          },
          {
            type: "TextBlock",
            text: `${data.employee_name || data.email} has completed their RoleColor assessment.`,
            wrap: true
          },
          {
            type: "FactSet",
            facts: [
              { title: "Primary Color", value: data.dominant_color || "N/A" },
              { title: "Secondary Color", value: data.secondary_color || "N/A" }
            ]
          }
        ];
        break;

      case "new_employee":
        card.attachments[0].content.body = [
          {
            type: "TextBlock",
            size: "large",
            weight: "bolder",
            text: "👋 New Team Member"
          },
          {
            type: "TextBlock",
            text: `${data.employee_name || data.email} has joined ${company.name}.`,
            wrap: true
          }
        ];
        break;

      case "task_assigned":
        card.attachments[0].content.body = [
          {
            type: "TextBlock",
            size: "large",
            weight: "bolder",
            text: "📋 Task Assigned"
          },
          {
            type: "TextBlock",
            text: data.task_title,
            weight: "bolder",
            wrap: true
          },
          {
            type: "FactSet",
            facts: [
              { title: "Assignee", value: data.assignee_name || data.assignee_email },
              { title: "Priority", value: data.priority || "Normal" }
            ]
          }
        ];
        break;

      case "reminder":
        card.attachments[0].content.body = [
          {
            type: "TextBlock",
            size: "large",
            weight: "bolder",
            text: "⏰ Reminder"
          },
          {
            type: "TextBlock",
            text: data.message,
            wrap: true
          }
        ];
        break;
    }

    // Send to Teams webhook
    const teamsResponse = await fetch(company.ms_teams_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card)
    });

    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text();
      console.error("Teams webhook error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send Teams notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Teams notification sent:", { company_id, event_type });

    return new Response(
      JSON.stringify({ success: true, message: "Teams notification sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending Teams notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
