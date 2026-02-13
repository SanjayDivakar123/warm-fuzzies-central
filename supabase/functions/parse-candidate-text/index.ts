import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use OpenAI to parse the candidate text
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiApiKey) {
      // Fallback to regex parsing if no API key
      return new Response(
        JSON.stringify(parseWithRegex(text)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a candidate information extractor. Extract structured data from the provided text which could be from a resume, LinkedIn profile, email, or any other source.

Return a JSON object with these fields (use null for missing fields):
- full_name: string (the person's full name)
- email: string (email address)
- phone: string (phone number, normalize to digits only with optional + prefix)
- position_title: string (current or most recent job title)
- linkedin_url: string (LinkedIn profile URL if present)
- skills: string[] (array of technical/professional skills mentioned)
- experience_summary: string (brief summary of work experience)
- education: string (education background)

Only return valid JSON, no markdown formatting.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI error:", data.error);
      return new Response(
        JSON.stringify(parseWithRegex(text)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = data.choices[0]?.message?.content;
    
    try {
      // Parse the JSON response
      const parsed = JSON.parse(content);
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Failed to parse GPT response:", content);
      return new Response(
        JSON.stringify(parseWithRegex(text)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fallback regex-based parsing
function parseWithRegex(text: string) {
  const result: Record<string, any> = {};
  
  // Email extraction
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }
  
  // Phone extraction
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0].replace(/[^\d+]/g, '');
  }
  
  // LinkedIn URL
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/i);
  if (linkedinMatch) {
    result.linkedin_url = linkedinMatch[0];
  }
  
  // Name extraction
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){0,3}$/.test(firstLine)) {
      result.full_name = firstLine;
    }
  }
  
  // Job title
  const titlePatterns = [
    /(?:Title|Position|Role):\s*(.+)/i,
    /(?:^|\n)([A-Za-z]+ (?:Engineer|Developer|Designer|Manager|Director|Analyst|Consultant|Specialist|Lead|Senior|Junior|Intern)[^\n]*)/i,
  ];
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.position_title = match[1].trim();
      break;
    }
  }
  
  // Skills
  const skillsMatch = text.match(/(?:Skills?|Technologies|Tech Stack):\s*(.+?)(?:\n\n|\n[A-Z]|$)/is);
  if (skillsMatch) {
    result.skills = skillsMatch[1]
      .split(/[,;•·\n]/)
      .map(s => s.trim())
      .filter(s => s && s.length < 50);
  }
  
  return result;
}
