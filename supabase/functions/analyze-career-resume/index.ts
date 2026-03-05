import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const careerProfiles: Record<string, { archetype: string; careers: string[] }> = {
  Yellow: {
    archetype: "Executor",
    careers: ["Operations Manager", "Engineering Lead", "Emergency Response Director", "Military Officer", "Project Manager", "Supply Chain Manager", "Construction Manager", "Plant Manager"]
  },
  Red: {
    archetype: "Motivator", 
    careers: ["Sales Director", "Founder / Entrepreneur", "Political Leader", "Executive Coach", "Media Personality", "Brand Director", "Motivational Speaker", "Recruiter / Talent Acquisition Lead"]
  },
  Green: {
    archetype: "Strategist",
    careers: ["Chief Technology Officer", "Data Scientist", "Financial Analyst", "Systems Architect", "Management Consultant", "Quality Assurance Director", "Research Scientist", "Chief Strategy Officer"]
  },
  Blue: {
    archetype: "Connector",
    careers: ["Human Resources Director", "Therapist / Counselor", "Chief People Officer", "Training & Development Manager", "Social Worker", "Customer Success Manager", "Non-Profit Director", "Healthcare Administrator"]
  }
};

function generateFallback(color: string, profile: { archetype: string; careers: string[] }) {
  return {
    extractedProfile: { name: "Resume Analysis", currentRole: "Based on your RoleColor", yearsExperience: 0, topSkills: [], education: "", industries: [] },
    careerMatches: profile.careers.slice(0, 5).map((title, i) => ({
      title,
      matchScore: 92 - i * 3,
      reasoning: `As a ${profile.archetype}, this role aligns with your natural strengths.`,
      relevantExperience: ["Your RoleColor profile indicates strong fit"],
      skillsToLeverage: [`${profile.archetype} mindset`, "Natural aptitude"],
      growthPath: "Explore this career path further"
    })),
    strengthsFromResume: [`Strong ${profile.archetype} characteristics`, "Leadership potential", "Career versatility"],
    developmentAreas: ["Continue developing your core strengths"],
    personalizedAdvice: `As a ${color} (${profile.archetype}), you thrive in roles like ${profile.careers[0]} and ${profile.careers[1]}. Leverage your natural ${profile.archetype.toLowerCase()} qualities for career success.`,
    colorProfile: { color, archetype: profile.archetype }
  };
}

serve(async (req) => {
  // Always handle OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Default fallback for any error
  const defaultFallback = (color = "Red") => {
    const profile = careerProfiles[color] || careerProfiles.Red;
    return new Response(
      JSON.stringify({ success: true, analysis: generateFallback(color, profile), fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  };

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("JSON parse error:", e);
      return defaultFallback();
    }

    const { resumeBase64, resumeText, fileType, primaryColor: rawColor } = body;

    // Normalize color to capitalized format (red -> Red, BLUE -> Blue)
    const primaryColor = rawColor 
      ? rawColor.charAt(0).toUpperCase() + rawColor.slice(1).toLowerCase()
      : "Red";

    const colorProfile = careerProfiles[primaryColor] || careerProfiles.Red;

    // If no OpenAI key or no resume content at all, return fallback
    const hasResumeContent = resumeBase64 || (resumeText && resumeText.length > 50);
    if (!OPENAI_API_KEY || !hasResumeContent) {
      console.log("Returning color-based recommendations (no API key or no resume content)");
      return new Response(
        JSON.stringify({ success: true, analysis: generateFallback(primaryColor, colorProfile), fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing resume for ${primaryColor} (${colorProfile.archetype}), type: ${fileType}, text length: ${resumeText?.length || 0}`);

    // For PDFs and Word docs, we can't process them directly - use AI to generate color-based recommendations
    // Only images can be processed by the vision API
    const isImage = fileType?.startsWith('image/');
    
    const systemPrompt = `You are a career advisor specializing in the RoleColor personality framework. Analyze the resume and provide career recommendations for a "${primaryColor}" RoleColor (${colorProfile.archetype} archetype).

Top careers for ${colorProfile.archetype}s: ${colorProfile.careers.join(", ")}.

IMPORTANT: Base your analysis on the ACTUAL resume content provided. Extract real information about the person's experience, skills, education, and background.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "extractedProfile": {
    "name": "Actual name from resume",
    "currentRole": "Their actual current or most recent role",
    "yearsExperience": number based on resume dates,
    "topSkills": ["actual skill 1", "actual skill 2", "skill3", "skill4", "skill5"],
    "education": "Actual education from resume",
    "industries": ["actual industry 1", "actual industry 2"]
  },
  "careerMatches": [
    {
      "title": "Career Title that fits their background AND ${colorProfile.archetype} profile",
      "matchScore": 92,
      "reasoning": "Specific reasoning based on THEIR actual experience combined with ${colorProfile.archetype} traits",
      "relevantExperience": ["Specific experience from their resume", "Another relevant point"],
      "skillsToLeverage": ["Their actual skill", "Another skill"],
      "growthPath": "Personalized growth path based on their background"
    }
  ],
  "strengthsFromResume": ["Specific strength from their resume", "Another strength", "Third strength"],
  "developmentAreas": ["Specific area based on their background", "Another area"],
  "personalizedAdvice": "2-3 sentences of personalized advice referencing their actual experience and ${colorProfile.archetype} traits"
}

Provide 5 career matches ranked by matchScore. Make sure each recommendation references SPECIFIC details from their resume.`;

    try {
      let messages;
      if (isImage && resumeBase64 && resumeBase64.length < 500000) {
        // Use vision API for images
        messages = [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyze this resume image:" },
              { type: "image_url", image_url: { url: `data:${fileType};base64,${resumeBase64}` } }
            ]
          }
        ];
      } else if (resumeText && resumeText.length > 50) {
        // Use extracted text from PDF
        const truncatedText = resumeText.substring(0, 8000); // Limit to ~8000 chars
        messages = [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Here is the resume text extracted from a PDF. Analyze it and provide personalized career recommendations based on the actual content:\n\n---RESUME START---\n${truncatedText}\n---RESUME END---\n\nThe person has a ${primaryColor} (${colorProfile.archetype}) RoleColor profile. Provide career matches that leverage BOTH their actual experience AND their ${colorProfile.archetype} personality traits.`
          }
        ];
      } else {
        // Fallback - no resume content
        messages = [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate personalized career recommendations for someone with the ${primaryColor} (${colorProfile.archetype}) RoleColor profile. They uploaded a resume but we couldn't extract the content. Create realistic, helpful career matches that align with their ${colorProfile.archetype} personality type.`
          }
        ];
      }

      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          max_tokens: 2500,
          temperature: 0.7
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("OpenAI error:", errText);
        // Return fallback on API error
        return new Response(
          JSON.stringify({ success: true, analysis: generateFallback(primaryColor, colorProfile), fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      console.log("AI response received, length:", content.length);

      // Parse JSON
      let analysis;
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("JSON parse failed, using fallback");
        analysis = generateFallback(primaryColor, colorProfile);
        analysis.personalizedAdvice = content.substring(0, 500);
      }

      analysis.colorProfile = { color: primaryColor, archetype: colorProfile.archetype };

      return new Response(
        JSON.stringify({ success: true, analysis }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (aiErr) {
      console.error("AI processing error:", aiErr);
      return new Response(
        JSON.stringify({ success: true, analysis: generateFallback(primaryColor, colorProfile), fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (err) {
    console.error("Function error:", err);
    // Always return 200 with fallback - never fail
    const fallbackProfile = careerProfiles.Red;
    return new Response(
      JSON.stringify({ success: true, analysis: generateFallback("Red", fallbackProfile), fallback: true, note: "fallback due to error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
