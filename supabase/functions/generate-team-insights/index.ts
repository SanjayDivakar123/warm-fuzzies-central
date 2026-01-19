import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { companyId, teamMembers } = await req.json();
    
    if (!teamMembers || teamMembers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No team members provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Perplexity API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the analysis prompt
    const teamSummary = teamMembers.map((m: TeamMember, i: number) => {
      const scoresSummary = `Yellow(Executor):${m.scores.yellow}, Red(Motivator):${m.scores.red}, Green(Organizer):${m.scores.green}, Blue(Innovator):${m.scores.blue}`;
      return `${i + 1}. Email: ${m.email}
   - Current Role: ${m.jobRole || 'Not assigned'}
   - Skills: ${m.skills?.join(', ') || 'None listed'}
   - Dominant Color: ${m.dominantColor} (${m.colorLabel})
   - Score Distribution: ${scoresSummary}`;
    }).join('\n\n');

    const systemPrompt = `You are an expert organizational psychologist and leadership consultant specializing in team dynamics, role-person fit analysis, and leadership style assessment.

You analyze teams using a color-based leadership assessment framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive
- Red (Motivator): Inspiring, people-focused, enthusiastic, relationship-builders
- Green (Organizer): Structured, detail-oriented, reliable, systematic thinkers
- Blue (Innovator): Creative, visionary, strategic, big-picture thinkers

Your task is to analyze team members' leadership styles and compare them to their current job roles to identify:
1. Role-leadership style alignment or mismatches
2. Where team members might be better suited
3. Team composition strengths and gaps
4. Strategic recommendations for team optimization

Always provide actionable, specific insights backed by the assessment data.`;

    const userPrompt = `Analyze this team's leadership profiles and role alignment:

TEAM MEMBERS:
${teamSummary}

Provide a comprehensive analysis in the following JSON format:
{
  "overallAnalysis": "A 2-3 sentence summary of the team's overall composition and dynamics",
  "teamStrengths": ["3-4 specific strengths based on the team's color distribution"],
  "teamChallenges": ["2-3 potential challenges or gaps in the team's composition"],
  "memberInsights": [
    {
      "email": "member email",
      "currentRole": "their current job role",
      "fitScore": "excellent|good|moderate|mismatch",
      "analysis": "2-3 sentences about how their leadership style aligns with their role",
      "suggestedRoles": ["1-3 roles that might better suit their style if not excellent fit"],
      "reasoning": "Brief explanation of the fit assessment"
    }
  ],
  "recommendations": ["3-5 strategic recommendations for team optimization and role adjustments"]
}

Consider these role-leadership style alignments:
- Engineers/QA: Often suit Green (systematic) or Blue (innovative problem-solving)
- Designers: Often suit Blue (creative) or Yellow (results-focused execution)
- PM/Operations: Often suit Green (organized) or Yellow (action-oriented)
- Sales/Marketing: Often suit Red (people-focused) or Yellow (results-driven)
- Support: Often suit Red (relationship-building) or Green (systematic)
- Founders: Often suit Blue (visionary) or Yellow (decisive)
- Analysts: Often suit Green (detail-oriented) or Blue (strategic)
- Writers: Often suit Blue (creative) or Green (structured)

Return ONLY the JSON object, no additional text.`;

    console.log("Calling Perplexity API for team insights...");

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      console.error("No content in Perplexity response:", data);
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
      console.error("Failed to parse Perplexity response:", parseError, content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully generated team insights");

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
