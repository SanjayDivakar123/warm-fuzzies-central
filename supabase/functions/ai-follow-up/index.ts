import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contextType, context, messages, question } = await req.json();

    if (!contextType || !context || !question) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contextType, context, question" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt based on context type
    let systemPrompt = "";
    
    if (contextType === "candidate-fit") {
      systemPrompt = `You are an expert hiring analyst helping evaluate a job candidate. You have access to the candidate's RoleColor assessment results and AI-generated fit analysis.

CANDIDATE CONTEXT:
${JSON.stringify(context, null, 2)}

RoleColor Framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive
- Red (Motivator): Inspiring, people-focused, enthusiastic, relationship-builders
- Green (Organizer): Structured, detail-oriented, reliable, systematic
- Blue (Innovator): Creative, visionary, strategic, big-picture thinkers

Answer the user's follow-up questions about this candidate concisely and helpfully. Provide actionable insights for hiring decisions. Use markdown formatting for clarity.`;
    } else if (contextType === "team-insights") {
      systemPrompt = `You are an expert organizational psychologist and leadership consultant. You have access to a team's RoleColor assessment results and AI-generated team insights.

TEAM CONTEXT:
${JSON.stringify(context, null, 2)}

RoleColor Framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive
- Red (Motivator): Inspiring, people-focused, enthusiastic, relationship-builders
- Green (Organizer): Structured, detail-oriented, reliable, systematic
- Blue (Innovator): Creative, visionary, strategic, big-picture thinkers

Answer the user's follow-up questions about this team concisely and helpfully. Provide strategic recommendations for team optimization. Use markdown formatting for clarity.`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid contextType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation history
    const conversationMessages: Message[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add previous messages if any
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        conversationMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current question
    conversationMessages.push({ role: "user", content: question });

    console.log(`Processing ${contextType} follow-up question:`, question);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully generated follow-up response");

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-follow-up:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
