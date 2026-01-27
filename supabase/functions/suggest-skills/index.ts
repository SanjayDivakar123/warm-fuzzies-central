import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobRole, existingSkills } = await req.json();

    if (!jobRole) {
      return new Response(
        JSON.stringify({ error: "jobRole is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existingSkillsList = existingSkills?.length > 0 
      ? `The user already has these skills: ${existingSkills.join(", ")}. Do NOT suggest any of these.`
      : "";

    const prompt = `Given the job role "${jobRole}", suggest 5-8 relevant professional skills that someone in this role would typically have.

${existingSkillsList}

Return ONLY a JSON array of skill strings. Keep skill names concise (1-3 words each). Focus on practical, actionable skills relevant to modern workplaces.

Examples of good skill formats: "Data Analysis", "Project Management", "UI Design", "Client Communication", "Strategic Planning"

Return format: ["skill1", "skill2", "skill3", ...]`;

    console.log(`Suggesting skills for job role: ${jobRole}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert HR consultant who helps identify professional skills based on job roles. Always respond with valid JSON arrays only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("Raw AI response:", content);

    // Parse the JSON array from the response
    let skills: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        skills = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try parsing the whole content
        skills = JSON.parse(content);
      }
      
      // Filter out any existing skills and ensure we have valid strings
      skills = skills
        .filter((s: any) => typeof s === "string" && s.trim())
        .map((s: string) => s.trim())
        .filter((s: string) => !existingSkills?.includes(s));
        
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return empty array if parsing fails
      skills = [];
    }

    console.log("Suggested skills:", skills);

    return new Response(
      JSON.stringify({ skills }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in suggest-skills:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
