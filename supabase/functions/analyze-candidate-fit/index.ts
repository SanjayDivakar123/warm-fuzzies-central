import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { candidateId } = await req.json();

    if (!candidateId) {
      return new Response(
        JSON.stringify({ error: "candidateId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch candidate with assessment result
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select(`
        *,
        assessment_results:assessment_result_id (results)
      `)
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      console.error("Candidate not found:", candidateError);
      return new Response(
        JSON.stringify({ error: "Candidate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!candidate.assessment_result_id) {
      return new Response(
        JSON.stringify({ error: "Assessment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assessmentResult = candidate.assessment_results?.results;
    if (!assessmentResult) {
      return new Response(
        JSON.stringify({ error: "Assessment results not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate basic fit score based on color match
    let colorMatchScore = 100;
    if (candidate.ideal_role_color && assessmentResult.dominantColor) {
      if (candidate.ideal_role_color === assessmentResult.dominantColor) {
        colorMatchScore = 100;
      } else {
        // Partial match based on secondary colors
        const scores = assessmentResult.scores || {};
        colorMatchScore = scores[candidate.ideal_role_color] || 50;
      }
    }

    // If OpenAI key is available, get AI-powered analysis
    let aiAnalysis = null;
    if (openaiKey) {
      const prompt = `Analyze this job candidate's fit based on their RoleColor assessment results.

Candidate Information:
- Position Applied For: ${candidate.position_title || "Not specified"}
- Ideal Role Color for Position: ${candidate.ideal_role_color || "Any"}

Assessment Results:
- Dominant Color: ${assessmentResult.dominantColor}
- Secondary Color: ${assessmentResult.secondaryColor || "Not determined"}
- Color Scores: ${JSON.stringify(assessmentResult.scores)}
- Key Strengths: ${JSON.stringify(assessmentResult.strengths || [])}

RoleColor Meanings:
- Yellow: Action-oriented, executors, fast-paced, builders
- Red: Motivators, communicators, persuaders, creative directors
- Green: Organized, planners, systematic, analytical
- Blue: Innovators, visionaries, strategists, researchers

IMPORTANT LEADERSHIP INSIGHT: The best leaders have Red and/or Yellow as their PRIMARY or SECONDARY colors. If the candidate has Red or Yellow as their second color (or both Red and Yellow in their top two), they have HIGH leadership potential. If neither Red nor Yellow appears in their top two colors, their leadership potential is LIMITED and this should be factored into the fit assessment, especially for leadership/management positions.

Provide a JSON response with:
1. "summary": A 2-3 sentence overall assessment (include leadership potential assessment)
2. "strengths": Array of 3-4 specific strengths for this role
3. "concerns": Array of 2-3 potential areas of concern or gaps
4. "recommendations": Array of 2-3 hiring recommendations
5. "fitScore": A number 0-100 representing overall fit
6. "leadershipPotential": "High" if Red/Yellow is primary or secondary, otherwise "Limited"

Return ONLY valid JSON, no markdown.`;

      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a hiring analyst expert in behavioral assessments. Provide concise, actionable insights." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            // Parse JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiAnalysis = JSON.parse(jsonMatch[0]);
            }
          }
        }
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
      }
    }

    // Combine scores
    const fitScore = aiAnalysis?.fitScore || colorMatchScore;
    const fitAnalysis = aiAnalysis || {
      summary: `Candidate's dominant color is ${assessmentResult.dominantColor}. ${candidate.ideal_role_color ? (candidate.ideal_role_color === assessmentResult.dominantColor ? 'This matches the ideal color for the position.' : 'This differs from the ideal color, but may still be a good fit.') : ''}`,
      strengths: assessmentResult.strengths || [],
      concerns: [],
      recommendations: [],
      colorMatch: candidate.ideal_role_color ? {
        actual: assessmentResult.dominantColor,
        ideal: candidate.ideal_role_color,
        matchPercentage: colorMatchScore,
      } : null,
    };

    // Update candidate with fit analysis
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        fit_score: fitScore,
        fit_analysis: fitAnalysis,
        fit_analyzed_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Failed to update candidate:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        fitScore,
        fitAnalysis,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-candidate-fit:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});