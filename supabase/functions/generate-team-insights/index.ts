import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface TeamMember {
  email: string;
  jobRole: string | null;
  skills: string[] | null;
  dominantColor: string;
  colorLabel: string;
  scores: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: { companyId?: string; teamMembers?: TeamMember[] };
    try {
      body = await req.json();
    } catch (parseErr) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { companyId, teamMembers } = body;

    if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No team members provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compact payload to reduce input tokens and latency.
    const teamSummary = teamMembers.map((m: TeamMember, i: number) => {
      const s = m.scores ?? {};
      const scores = `Y${s.yellow ?? 0}R${s.red ?? 0}G${s.green ?? 0}B${s.blue ?? 0}`;
      const skills = (m.skills || []).slice(0, 4).join(", ") || "—";
      return `${i + 1}. ${m.email} | ${m.jobRole || "N/A"} | ${m.dominantColor || "blue"} (${m.colorLabel || "?"}) | ${scores} | ${skills}`;
    }).join("\n");

    const systemPrompt = `You are an expert organizational psychologist and leadership consultant. Be concise — short outputs reduce latency.

Color-based leadership framework:
- Yellow (Executor): Action-oriented, results-driven, decisive
- Red (Motivator): Inspiring, people-focused, relationship-builders
- Green (Organizer): Structured, detail-oriented, systematic
- Blue (Innovator): Creative, visionary, strategic

Leadership potential is highest when Red/Yellow are primary or secondary. Use concrete score evidence. Return only valid JSON.`;

    const userPrompt = `Analyze this team's leadership profiles. Be brief — 1 sentence per field where possible.

TEAM MEMBERS:
${teamSummary}

Return this JSON shape exactly:

{
  "overallAnalysis": "1-2 sentence summary of team composition",
  "teamDynamics": "1 sentence on collaboration dynamics",
  "teamStrengths": ["3 specific strengths"],
  "teamChallenges": ["3 potential gaps"],
  "memberInsights": [
    {
      "email": "member email",
      "name": "First name from email",
      "currentRole": "their job role",
      "dominantColor": "their dominant color",
      "fitScore": "excellent|good|moderate|mismatch",
      "matchPercentage": "0-100 (excellent 85+, good 70-84, moderate 50-69, mismatch <50)",
      "matchAnalysis": "1-2 sentences on role fit with score evidence",
      "leadershipStyle": "1 sentence",
      "workplaceContribution": "1 sentence",
      "strengths": ["2 key strengths"],
      "developmentAreas": ["2 growth areas"],
      "potentialChallenges": "1 short sentence",
      "suggestedRoles": ["2 alternative roles if moderate/mismatch, else 2 complementary responsibilities"],
      "actionableAdvice": "1 sentence of practical advice"
    }
  ],
  "recommendations": ["3 strategic recommendations"]
}

Role alignment: Engineers/QA→Green/Blue; Designers→Blue/Yellow; PM/Admin→Green/Yellow; Sales/BD→Red/Yellow; HR/Support→Red/Green; Executives→Blue/Yellow; Data/Finance→Green/Blue.

IMPORTANT: memberInsights MUST have exactly ${teamMembers.length} entries — one per member. Keep each entry brief and balanced.

Return ONLY the JSON object, no other text.`;

    const OUTPUT_TOKENS_BASE = 800;
    const OUTPUT_TOKENS_PER_MEMBER_TARGET = 260;
    const OUTPUT_TOKENS_PER_MEMBER_MIN = 200;
    const MODEL_MAX_OUTPUT_TOKENS = 16000;

    const desiredTokenBudget =
      OUTPUT_TOKENS_BASE + (teamMembers.length * OUTPUT_TOKENS_PER_MEMBER_TARGET);
    const tokenBudget = Math.min(MODEL_MAX_OUTPUT_TOKENS, desiredTokenBudget);
    const effectivePerMemberBudget = Math.floor(
      Math.max(0, tokenBudget - OUTPUT_TOKENS_BASE) / teamMembers.length
    );

    if (effectivePerMemberBudget < OUTPUT_TOKENS_PER_MEMBER_MIN) {
      const maxMembersSupported = Math.floor(
        (MODEL_MAX_OUTPUT_TOKENS - OUTPUT_TOKENS_BASE) / OUTPUT_TOKENS_PER_MEMBER_MIN
      );
      return new Response(
        JSON.stringify({
          error: `Team is too large for one insight run (${teamMembers.length} members). Please analyze up to ${maxMembersSupported} members at a time.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `Calling OpenAI API for detailed team insights (${teamMembers.length} members, ${tokenBudget} max_tokens, ~${effectivePerMemberBudget} per member)...`
    );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: tokenBudget,
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

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid OpenAI API key. Please check your configuration." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate insights from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in OpenAI response:", data);
      return new Response(
        JSON.stringify({ error: "No insights generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let insights;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      insights = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully generated detailed team insights with OpenAI");

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-team-insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
