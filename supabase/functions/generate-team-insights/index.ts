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
      const totalScore = m.scores.yellow + m.scores.red + m.scores.green + m.scores.blue;
      const percentages = {
        yellow: Math.round((m.scores.yellow / totalScore) * 100),
        red: Math.round((m.scores.red / totalScore) * 100),
        green: Math.round((m.scores.green / totalScore) * 100),
        blue: Math.round((m.scores.blue / totalScore) * 100),
      };
      
      return `${i + 1}. Email: ${m.email}
   - Current Job Role: ${m.jobRole || 'Not assigned'}
   - Skills: ${m.skills?.join(', ') || 'None listed'}
   - Dominant Color: ${m.dominantColor} (${m.colorLabel})
   - Score Distribution: ${scoresSummary}
   - Percentages: Yellow:${percentages.yellow}%, Red:${percentages.red}%, Green:${percentages.green}%, Blue:${percentages.blue}%`;
    }).join('\n\n');

    const systemPrompt = `You are an expert organizational psychologist and leadership consultant specializing in team dynamics, role-person fit analysis, and leadership style assessment.

You analyze teams using a color-based leadership assessment framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive, quick decision-makers
- Red (Motivator): Inspiring, people-focused, enthusiastic, relationship-builders, empathetic
- Green (Organizer): Structured, detail-oriented, reliable, systematic thinkers, process-focused
- Blue (Innovator): Creative, visionary, strategic, big-picture thinkers, future-focused

Your task is to provide DEEP, PERSONALIZED analysis for each team member, examining:
1. How their leadership style matches or conflicts with their job role
2. Their specific strengths in their current position
3. Areas where their style might create friction with their responsibilities
4. Concrete, actionable advice for improvement

Be specific and reference their actual scores and role. Avoid generic advice.`;

    const userPrompt = `Analyze this team's leadership profiles and provide DETAILED individual analysis:

TEAM MEMBERS:
${teamSummary}

Provide a comprehensive analysis in the following JSON format. For memberInsights, be VERY specific about the leadership-role match for each person:

{
  "overallAnalysis": "3-4 sentence comprehensive summary of the team's composition, dynamics, and potential",
  "teamDynamics": "2-3 sentences about how the team members' different styles interact and complement each other",
  "teamStrengths": ["4-5 specific strengths based on the team's color distribution and role mix"],
  "teamChallenges": ["3-4 potential challenges or gaps in the team's composition"],
  "memberInsights": [
    {
      "email": "member email",
      "name": "Extract a display name from email (capitalize first part before @)",
      "currentRole": "their current job role",
      "dominantColor": "their dominant color",
      "fitScore": "excellent|good|moderate|mismatch",
      "matchAnalysis": "3-4 sentences specifically analyzing how their dominant color (and secondary tendencies) align or conflict with their job role. Be specific about what works and what doesn't.",
      "leadershipStyle": "2-3 sentences describing their leadership approach based on their score distribution",
      "workplaceContribution": "2 sentences about what unique value they bring to the team",
      "strengths": ["3-4 specific strengths this person brings based on their color profile and role"],
      "developmentAreas": ["2-3 specific areas where they could grow given their role requirements"],
      "potentialChallenges": "1-2 sentences about challenges they might face in their role due to their style",
      "suggestedRoles": ["2-3 alternative roles if fit is moderate/mismatch, or complementary responsibilities if fit is good/excellent"],
      "actionableAdvice": "1-2 sentences of specific, practical advice for this person to maximize their effectiveness in their current role"
    }
  ],
  "recommendations": ["5-6 strategic recommendations for team optimization, collaboration improvements, and role adjustments"],
  "hiringRecommendations": ["2-3 recommendations about what leadership styles would complement this team for future hires"]
}

Role-leadership style alignment guidelines:
- Engineers/QA/Tech: Green (systematic) or Blue (innovative) styles work well
- Designers/Creative: Blue (creative) or Yellow (results-focused) styles work well
- PM/Operations/Admin: Green (organized) or Yellow (action-oriented) styles work well
- Sales/Marketing/BD: Red (people-focused) or Yellow (results-driven) styles work well
- HR/Support/Customer Success: Red (relationship-building) or Green (systematic) styles work well
- Founders/Executives: Blue (visionary) or Yellow (decisive) styles work well
- Data Analysts/Finance: Green (detail-oriented) or Blue (strategic) styles work well

Return ONLY the JSON object, no additional text.`;

    console.log("Calling Perplexity API for detailed team insights...");

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
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

    console.log("Successfully generated detailed team insights");

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