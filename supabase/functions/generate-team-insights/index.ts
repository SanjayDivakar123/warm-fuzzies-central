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

    const systemPrompt = `You are an expert organizational psychologist and leadership consultant.

You analyze teams using a color-based leadership assessment framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive, quick decision-makers
- Red (Motivator): Inspiring, people-focused, enthusiastic, relationship-builders, empathetic
- Green (Organizer): Structured, detail-oriented, reliable, systematic thinkers, process-focused
- Blue (Innovator): Creative, visionary, strategic, big-picture thinkers, future-focused

Leadership insight: leadership potential is highest when Red and/or Yellow are primary or secondary colors.

Be specific, role-aware, and concrete with score-based evidence. Keep writing efficient, but preserve depth.
Return only valid JSON.`;

    const userPrompt = `Analyze this team's leadership profiles.

TEAM MEMBERS:
${teamSummary}

Return this JSON shape exactly:

{
  "overallAnalysis": "2-3 sentence summary of team composition and implications",
  "teamDynamics": "1-2 sentences about collaboration dynamics",
  "teamStrengths": ["4 specific strengths"],
  "teamChallenges": ["3-4 potential gaps/challenges"],
  "memberInsights": [
    {
      "email": "member email",
      "name": "Extract a display name from email (capitalize first part before @)",
      "currentRole": "their current job role",
      "dominantColor": "their dominant color",
      "fitScore": "excellent|good|moderate|mismatch",
      "matchPercentage": "0-100 using these bands: excellent 85-100, good 70-84, moderate 50-69, mismatch 0-49",
      "matchAnalysis": "2-3 sentences explaining role fit with specific score evidence",
      "leadershipPotential": "High|Moderate|Limited (High when Red/Yellow is primary or secondary unless strong counter-evidence)",
      "leadershipStyle": "1-2 sentences",
      "workplaceContribution": "1-2 sentences",
      "strengths": ["3 specific strengths"],
      "developmentAreas": ["2-3 growth areas"],
      "potentialChallenges": "1 concise sentence",
      "suggestedRoles": ["2-3 stronger alternative roles if fit is moderate/mismatch, otherwise 2-3 complementary responsibilities"],
      "actionableAdvice": "1-2 sentences of specific, practical advice for this person to maximize their effectiveness"
    }
  ],
  "recommendations": ["4-5 strategic recommendations"]
}

Role-leadership style alignment guidelines:
- Engineers/QA/Tech: Green (systematic) or Blue (innovative) styles work well
- Designers/Creative: Blue (creative) or Yellow (results-focused) styles work well
- PM/Operations/Admin: Green (organized) or Yellow (action-oriented) styles work well
- Sales/Marketing/BD: Red (people-focused) or Yellow (results-driven) styles work well
- HR/Support/Customer Success: Red (relationship-building) or Green (systematic) styles work well
- Founders/Executives: Blue (visionary) or Yellow (decisive) styles work well
- Data Analysts/Finance: Green (detail-oriented) or Blue (strategic) styles work well

IMPORTANT: memberInsights MUST have exactly ${teamMembers.length} entries — one per member listed above. Do not skip or omit anyone.
Keep each entry reasonably concise, but maintain depth and specificity.

Return ONLY the JSON object, no other text.`;

    const OUTPUT_TOKENS_BASE = 1100;
    const OUTPUT_TOKENS_PER_MEMBER_TARGET = 360;
    const OUTPUT_TOKENS_PER_MEMBER_MIN = 280;
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
