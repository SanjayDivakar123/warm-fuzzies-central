import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskEmailRequest {
  task: {
    title: string;
    description: string;
    importance: string;
    urgency: string;
    dueDate?: string;
    requiredSkills: string[];
  };
  additionalDetails: string;
  assigneeName: string;
  companyName: string;
  reasoning?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, additionalDetails, assigneeName, companyName, reasoning } = await req.json() as TaskEmailRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional email composer for workplace task assignments. 
Write clear, friendly, and professional emails that:
- Get straight to the point
- Clearly explain the task and expectations
- Are encouraging and supportive in tone
- Include any deadlines or priority information
- Are formatted for easy reading

Do NOT include placeholder text like [Your Name] - the email should be ready to send.`;

    const userPrompt = `Draft a professional email to assign the following task to ${assigneeName} at ${companyName}.

TASK DETAILS:
- Title: ${task.title}
- Description: ${task.description}
- Importance: ${task.importance}
- Urgency: ${task.urgency}
${task.dueDate ? `- Due Date: ${task.dueDate}` : ''}
${task.requiredSkills.length > 0 ? `- Required Skills: ${task.requiredSkills.join(', ')}` : ''}

${additionalDetails ? `ADDITIONAL CONTEXT FROM MANAGER:\n${additionalDetails}` : ''}

${reasoning ? `WHY THIS PERSON WAS SELECTED:\n${reasoning}` : ''}

Please provide:
1. A concise email subject line (without "Subject:" prefix)
2. The email body (professional but friendly tone, ready to send)

Format your response as JSON with "subject" and "body" keys.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse the JSON response from the AI
    let emailData = { subject: "", body: "" };
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to parse the whole content
        emailData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback: use the content as the body
      emailData = {
        subject: `Task Assignment: ${task.title}`,
        body: content,
      };
    }

    console.log("Generated email draft:", { subject: emailData.subject, bodyLength: emailData.body.length });

    return new Response(JSON.stringify(emailData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in draft-task-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
