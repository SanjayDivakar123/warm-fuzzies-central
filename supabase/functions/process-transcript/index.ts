import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const ROLECOLOR_DEFINITIONS = {
  red: "Directive, urgency, ownership, challenge, decisiveness",
  yellow: "Action items, deadlines, process steps, follow-ups, execution",
  green: "Risk flags, frameworks, systemic thinking, structure, processes",
  blue: "Vision, reframing, big-picture thinking, strategic questions, innovation"
};

async function callOpenAI(messages: any[], systemPrompt?: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const body: any = {
    model: "gpt-4o",
    max_tokens: 2000,
    messages: systemPrompt
      ? [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      : messages
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  return await response.json();
}

async function classifyUtterance(text: string) {
  if (!text || text.trim().length === 0) {
    return { signal: null, confidence: 0 };
  }

  try {
    const systemPrompt = `Classify this meeting utterance into a RoleColor signal based on these definitions:
- red: ${ROLECOLOR_DEFINITIONS.red}
- yellow: ${ROLECOLOR_DEFINITIONS.yellow}
- green: ${ROLECOLOR_DEFINITIONS.green}
- blue: ${ROLECOLOR_DEFINITIONS.blue}
- null: filler, small talk, unclear

Respond ONLY with JSON: {"signal": "red"|"yellow"|"green"|"blue"|null, "confidence": 0.0-1.0}`;

    const response = await callOpenAI(
      [{ role: "user", content: text }],
      systemPrompt
    );

    const message = response.choices[0].message;
    if (!message.content) {
      return { signal: null, confidence: 0 };
    }

    const result = JSON.parse(message.content);
    return {
      signal: result.signal || null,
      confidence: Math.min(1, Math.max(0, result.confidence || 0))
    };
  } catch (error) {
    console.error("Error classifying utterance:", error);
    return { signal: null, confidence: 0 };
  }
}

async function generateReport(reportPrompt: string) {
  try {
    const response = await callOpenAI([
      { role: "user", content: reportPrompt }
    ]);

    const message = response.choices[0].message;
    if (!message.content) {
      throw new Error("Empty response from OpenAI");
    }

    let jsonStr = message.content;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating report:", error);
    throw new Error("Failed to generate meeting report");
  }
}

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
    const { action, text, meetingData } = await req.json();

    if (action === "classify") {
      const result = await classifyUtterance(text);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else if (action === "generate-report") {
      const reportPrompt = `You are analyzing a meeting recording with RoleColor-based behavioral analysis.

Meeting Data:
- Title: ${meetingData.title}
- Platform: ${meetingData.platform}
- Participants: ${meetingData.participants.join(", ")}
- Duration: ${new Date(meetingData.endedAt).getTime() - new Date(meetingData.startedAt).getTime()}ms
- Total Utterances: ${meetingData.utterances.length}

RoleColor Signals (from transcript analysis):
${meetingData.utterances
  .filter((u: any) => u.rolecolorSignal)
  .map((u: any) => `- ${u.speaker}: "${u.text.substring(0, 100)}..." [${u.rolecolorSignal.toUpperCase()}] (${u.confidence.toFixed(2)}% confidence)`)
  .join("\n")}

Based on this analysis, generate a meeting report. Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence summary of the meeting",
  "alignmentScore": 0-100 (how aligned was the team on decisions),
  "keyMoments": [{"timestampMs": number, "speaker": "string", "text": "string (max 100 chars)", "rolecolor": "red|yellow|green|blue"}],
  "actionItems": [{"task": "string", "owner": "string", "rolecolor": "red|yellow|green|blue"}],
  "recommendations": [{"speaker": "string", "note": "string (personalized coaching note)"}],
  "participantDynamics": {
    "dominantColor": "the most common RoleColor",
    "secondaryColor": "the second most common",
    "teamAlignment": "brief description of team alignment"
  }
}`;

      const result = await generateReport(reportPrompt);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
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
