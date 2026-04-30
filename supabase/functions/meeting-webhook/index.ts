import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    const { bot_id, status, type } = payload;

    if (!bot_id) {
      return new Response(JSON.stringify({ error: "Missing bot_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map Recall.ai webhook events to our bot_join_status
    let newStatus = null;
    switch (type) {
      case "bot.joining_call":
      case "bot.in_waiting_room":
        newStatus = "joining";
        break;
      case "bot.in_call_not_recording":
        newStatus = "live";
        break;
      case "bot.recording_started":
        newStatus = "live";
        break;
      case "bot.done":
        newStatus = "processing";
        break;
      case "bot.fatal":
        newStatus = "failed";
        break;
    }

    if (!newStatus) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update meeting status
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .update({
        bot_join_status: newStatus,
        chat_message_sent:
          type === "bot.recording_started" ||
          type === "bot.in_call_not_recording"
            ? true
            : undefined,
        started_at: type === "bot.recording_started" ? new Date().toISOString() : undefined,
        ended_at: type === "bot.done" ? new Date().toISOString() : undefined,
      })
      .eq("bot_id", bot_id)
      .select()
      .single();

    if (meetingError) {
      console.error("Error updating meeting:", meetingError);
      return new Response(
        JSON.stringify({ error: "Failed to update meeting" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // If bot finished, fetch transcript
    if (type === "bot.done" && meeting) {
      // Trigger transcript processing in background
      // This would normally call a separate function or worker
      console.log("Meeting finished, transcript would be fetched for:", bot_id);
    }

    return new Response(JSON.stringify({ success: true, meeting }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
