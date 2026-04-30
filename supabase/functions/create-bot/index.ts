import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RECALL_BASE = "https://us-west-2.recall.ai/api/v1";

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { meetingUrl, webhookUrl } = await req.json();
    console.log("Request received:", { meetingUrl, webhookUrl });

    const recallApiKey = Deno.env.get("RECALL_API_KEY") || Deno.env.get("VITE_RECALL_API_KEY");
    console.log("API key found:", !!recallApiKey);

    if (!recallApiKey) {
      console.error("RECALL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "RECALL_API_KEY not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    if (!meetingUrl || !webhookUrl) {
      return new Response(
        JSON.stringify({ error: "Missing meetingUrl or webhookUrl" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    console.log("Calling Recall API...");
    const response = await fetch(`${RECALL_BASE}/bot/`, {
      method: "POST",
      headers: {
        "Authorization": recallApiKey,
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        bot_name: "RoleColor AI",
        chat: {
          on_bot_join: {
            send_to: "everyone",
            message: "👋 RoleColor AI is recording this meeting to generate a team dynamics report. All participants have been notified."
          }
        },
        webhook_url: webhookUrl
      })
    });

    console.log("Recall API response status:", response.status);
    if (!response.ok) {
      const error = await response.text();
      console.error("Recall API error:", response.status, error);
      return new Response(
        JSON.stringify({ error: `Recall API error: ${response.status}` }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const bot = await response.json();
    return new Response(JSON.stringify(bot), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});
