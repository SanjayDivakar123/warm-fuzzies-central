import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailDesign {
  tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  includeTaskDetails: boolean;
  includeDeadline: boolean;
  includeSkills: boolean;
  signOff: string;
  senderName: string;
}

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
  design?: EmailDesign;
  reasoning?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, additionalDetails, assigneeName, companyName, reasoning, design } = await req.json() as TaskEmailRequest;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Tone-specific instructions
    const toneInstructions = {
      professional: 'Use formal business language. Be clear, concise, and respectful. Maintain a structured format.',
      friendly: 'Be warm and personable while staying professional. Use a conversational tone. Show enthusiasm.',
      urgent: 'Be direct and action-oriented. Emphasize priority and timeline. Use short sentences. Create a sense of importance.',
      casual: 'Be relaxed and conversational. Feel free to be brief. Keep it light but clear.',
    };

    const selectedTone = design?.tone || 'professional';
    const signOff = design?.signOff || 'Best regards';
    const senderName = design?.senderName || 'The Team';

    const systemPrompt = `You are an email composer for workplace task assignments.
Write emails with the following style: ${toneInstructions[selectedTone]}

Guidelines:
- Get straight to the point
- Be encouraging and supportive
- Format for easy reading with short paragraphs
- End with: "${signOff},\\n${senderName}"

Do NOT include placeholder text - the email should be ready to send.`;

    // Build content sections based on design choices
    const sections: string[] = [];
    
    if (design?.includeTaskDetails !== false) {
      sections.push(`TASK TO INCLUDE:
- Title: ${task.title}
- Description: ${task.description}`);
    }
    
    if (design?.includeDeadline !== false && task.dueDate) {
      sections.push(`DEADLINE: ${task.dueDate}`);
    }
    
    if (design?.includeSkills && task.requiredSkills.length > 0) {
      sections.push(`REQUIRED SKILLS: ${task.requiredSkills.join(', ')}`);
    }

    const userPrompt = `Draft an email to assign a task to ${assigneeName} at ${companyName}.

${sections.join('\n\n')}
Priority: ${task.importance} importance, ${task.urgency} urgency

${additionalDetails ? `ADDITIONAL CONTEXT FROM MANAGER:\n${additionalDetails}` : ''}

${reasoning ? `WHY THIS PERSON WAS SELECTED (for context, don't include verbatim):\n${reasoning}` : ''}

Provide a JSON response with "subject" and "body" keys. Subject should be concise.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
