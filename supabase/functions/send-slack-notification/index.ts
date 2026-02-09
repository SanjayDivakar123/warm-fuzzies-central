import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SLACK_API_BASE = "https://slack.com/api";

interface SlackNotificationRequest {
  company_id: string;
  event_type: "assessment_completed" | "new_employee" | "reminder" | "task_assigned" | "dm_invite" | "share_results";
  data: Record<string, any>;
}

// Color mapping for RoleColor results
const COLOR_HEX: Record<string, string> = {
  yellow: "#F9E547",
  red: "#E11D48",
  green: "#22C55E",
  blue: "#3B82F6",
};

// Get Slack user by email
async function getSlackUserByEmail(botToken: string, email: string): Promise<string | null> {
  try {
    const response = await fetch(`${SLACK_API_BASE}/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const data = await response.json();
    if (data.ok && data.user) {
      return data.user.id;
    }
    console.log("Slack user not found for email:", email, data.error);
    return null;
  } catch (error) {
    console.error("Error looking up Slack user:", error);
    return null;
  }
}

// Send direct message to a user
async function sendDirectMessage(botToken: string, userId: string, blocks: any[], text: string): Promise<boolean> {
  try {
    // Open a DM channel
    const openResponse = await fetch(`${SLACK_API_BASE}/conversations.open`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users: userId }),
    });
    
    const openData = await openResponse.json();
    if (!openData.ok) {
      console.error("Failed to open DM channel:", openData.error);
      return false;
    }
    
    const channelId = openData.channel.id;
    
    // Send the message
    const messageResponse = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        text: text,
        blocks: blocks,
      }),
    });
    
    const messageData = await messageResponse.json();
    if (!messageData.ok) {
      console.error("Failed to send DM:", messageData.error);
      return false;
    }
    
    console.log("DM sent successfully to user:", userId);
    return true;
  } catch (error) {
    console.error("Error sending DM:", error);
    return false;
  }
}

// Post message to a channel
async function postToChannel(botToken: string, channelId: string, blocks: any[], text: string): Promise<boolean> {
  try {
    const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        text: text,
        blocks: blocks,
      }),
    });
    
    const data = await response.json();
    if (!data.ok) {
      console.error("Failed to post to channel:", data.error);
      return false;
    }
    
    console.log("Message posted to channel:", channelId);
    return true;
  } catch (error) {
    console.error("Error posting to channel:", error);
    return false;
  }
}

// Build invite DM blocks
function buildInviteBlocks(companyName: string, inviteCode: string, portalUrl: string): any[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `👋 *Hey there!*\n\n*${companyName}* has invited you to take the RoleColor Assessment. This quick assessment will help identify your work style and how you collaborate best with your team.`
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🔑 *Your Invite Code*\n\`${inviteCode}\``
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Start Assessment 🚀",
            emoji: true
          },
          url: portalUrl,
          style: "primary"
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Powered by <https://rolecolorfinder.com|RoleColorFinder> • Takes about 5-10 minutes`
        }
      ]
    }
  ];
}

// Build assessment completed blocks for channel
function buildCompletedBlocks(
  employeeName: string, 
  employeeEmail: string,
  dominantColor: string, 
  secondaryColor: string | null,
  scores: Record<string, number>
): any[] {
  const colorEmoji: Record<string, string> = {
    yellow: "🟡",
    red: "🔴",
    green: "🟢",
    blue: "🔵",
  };
  
  const colorName = dominantColor.charAt(0).toUpperCase() + dominantColor.slice(1);
  const secondaryName = secondaryColor ? secondaryColor.charAt(0).toUpperCase() + secondaryColor.slice(1) : null;
  
  // Build score bars
  const scoreText = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([color, score]) => `${colorEmoji[color] || "⚪"} ${color.charAt(0).toUpperCase() + color.slice(1)}: ${Math.round(score)}%`)
    .join("\n");

  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🎉 *Assessment Completed!*\n\n*${employeeName || employeeEmail}* has completed their RoleColor assessment.`
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Primary Color*\n${colorEmoji[dominantColor] || "⚪"} ${colorName}`
        },
        {
          type: "mrkdwn",
          text: secondaryName 
            ? `*Secondary Color*\n${colorEmoji[secondaryColor!] || "⚪"} ${secondaryName}`
            : `*Secondary Color*\n—`
        }
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Color Profile*\n${scoreText}`
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📧 ${employeeEmail} • Completed just now`
        }
      ]
    }
  ];
  
  return blocks;
}

// Build share results blocks
function buildShareResultsBlocks(
  employeeName: string,
  dominantColor: string,
  secondaryColor: string | null,
  scores: Record<string, number>,
  strengths: string[],
  shareUrl?: string
): any[] {
  const colorEmoji: Record<string, string> = {
    yellow: "🟡",
    red: "🔴",
    green: "🟢",
    blue: "🔵",
  };
  
  const colorName = dominantColor.charAt(0).toUpperCase() + dominantColor.slice(1);
  
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${employeeName}'s RoleColor Profile`,
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${colorEmoji[dominantColor] || "⚪"} *Primary: ${colorName}*${secondaryColor ? ` • Secondary: ${secondaryColor.charAt(0).toUpperCase() + secondaryColor.slice(1)}` : ""}`
      }
    }
  ];
  
  if (strengths && strengths.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Key Strengths*\n${strengths.slice(0, 4).map(s => `• ${s}`).join("\n")}`
      }
    });
  }
  
  if (shareUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Full Results",
            emoji: true
          },
          url: shareUrl
        }
      ]
    });
  }
  
  return blocks;
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

    // Get company settings including bot token
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, subdomain, subdomain_enabled, slack_notifications_enabled, slack_channel_id, slack_bot_token")
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
        JSON.stringify({ success: false, message: "Slack notifications disabled for this company" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company.slack_bot_token) {
      return new Response(
        JSON.stringify({ success: false, message: "Slack bot token not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = company.slack_bot_token;
    let success = false;
    let message = "";

    switch (event_type) {
      case "dm_invite": {
        // DM an assessment invite to an employee
        const { email, invite_code, full_name } = data;
        
        if (!email || !invite_code) {
          return new Response(
            JSON.stringify({ error: "Missing email or invite_code for dm_invite" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const slackUserId = await getSlackUserByEmail(botToken, email);
        
        if (!slackUserId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Slack user not found for email: ${email}. They may not be in your Slack workspace.` 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Always use path-based URL
        const portalUrl = `https://rolecolorfinder.com/company/${company.subdomain}/login`;
        
        const inviteBlocks = buildInviteBlocks(company.name, invite_code, portalUrl);
        success = await sendDirectMessage(
          botToken, 
          slackUserId, 
          inviteBlocks, 
          `${company.name} has invited you to take the RoleColor Assessment. Your invite code: ${invite_code}`
        );
        
        message = success 
          ? `Invite DM sent to ${full_name || email}` 
          : `Failed to send invite DM to ${email}`;
        break;
      }
      
      case "assessment_completed": {
        // Notify channel when someone completes their assessment
        const { employee_name, email, dominant_color, secondary_color, scores } = data;
        
        if (!company.slack_channel_id) {
          return new Response(
            JSON.stringify({ success: false, message: "No Slack channel configured for notifications" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const completedBlocks = buildCompletedBlocks(
          employee_name,
          email,
          dominant_color || "blue",
          secondary_color,
          scores || {}
        );
        
        success = await postToChannel(
          botToken,
          company.slack_channel_id,
          completedBlocks,
          `🎉 ${employee_name || email} completed their RoleColor assessment!`
        );
        
        message = success 
          ? "Assessment completion notification posted to channel" 
          : "Failed to post completion notification";
        break;
      }
      
      case "share_results": {
        // Share someone's results in a channel
        const { employee_name, dominant_color, secondary_color, scores, strengths, share_url, channel_id } = data;
        const targetChannel = channel_id || company.slack_channel_id;
        
        if (!targetChannel) {
          return new Response(
            JSON.stringify({ success: false, message: "No channel specified for sharing results" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const shareBlocks = buildShareResultsBlocks(
          employee_name,
          dominant_color || "blue",
          secondary_color,
          scores || {},
          strengths || [],
          share_url
        );
        
        success = await postToChannel(
          botToken,
          targetChannel,
          shareBlocks,
          `${employee_name}'s RoleColor Profile`
        );
        
        message = success 
          ? "Results shared to channel" 
          : "Failed to share results";
        break;
      }
      
      case "new_employee": {
        // Notify when a new employee joins
        const { employee_name, email } = data;
        
        if (!company.slack_channel_id) {
          return new Response(
            JSON.stringify({ success: false, message: "No Slack channel configured" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `👋 *New Team Member!*\n\n*${employee_name || email}* has joined ${company.name} and completed their RoleColor assessment.`
            }
          }
        ];
        
        success = await postToChannel(
          botToken,
          company.slack_channel_id,
          blocks,
          `👋 ${employee_name || email} has joined ${company.name}!`
        );
        
        message = success ? "New employee notification sent" : "Failed to send notification";
        break;
      }
      
      case "task_assigned": {
        // Notify about task assignment
        const { task_title, assignee_name, assignee_email, priority } = data;
        
        // Try to DM the assignee
        const slackUserId = await getSlackUserByEmail(botToken, assignee_email);
        
        if (slackUserId) {
          const blocks = [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `📋 *New Task Assigned*\n\n*${task_title}*`
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Priority*\n${priority || "Normal"}`
                },
                {
                  type: "mrkdwn",
                  text: `*From*\n${company.name}`
                }
              ]
            }
          ];
          
          success = await sendDirectMessage(
            botToken,
            slackUserId,
            blocks,
            `📋 New task assigned: ${task_title}`
          );
          
          message = success ? "Task notification sent via DM" : "Failed to send task notification";
        } else {
          message = `Slack user not found for ${assignee_email}`;
        }
        break;
      }
      
      case "reminder": {
        // Send a reminder DM
        const { email, reminder_message } = data;
        
        const slackUserId = await getSlackUserByEmail(botToken, email);
        
        if (slackUserId) {
          const blocks = [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `⏰ *Reminder*\n\n${reminder_message || "Don't forget to complete your RoleColor assessment!"}`
              }
            }
          ];
          
          success = await sendDirectMessage(
            botToken,
            slackUserId,
            blocks,
            `⏰ Reminder: ${reminder_message || "Complete your RoleColor assessment"}`
          );
          
          message = success ? "Reminder sent" : "Failed to send reminder";
        } else {
          message = `Slack user not found for ${email}`;
        }
        break;
      }
      
      default:
        message = `Unknown event type: ${event_type}`;
    }

    return new Response(
      JSON.stringify({ success, message, event_type }),
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
