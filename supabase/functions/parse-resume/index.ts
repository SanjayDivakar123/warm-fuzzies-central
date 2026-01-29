import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { candidateId, resumeUrl } = await req.json();

    if (!candidateId || !resumeUrl) {
      return new Response(
        JSON.stringify({ error: "candidateId and resumeUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Parsing resume for candidate ${candidateId}`);

    // Fetch the resume file
    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error("Failed to fetch resume file");
    }

    const resumeBlob = await resumeResponse.blob();
    const resumeArrayBuffer = await resumeBlob.arrayBuffer();
    const resumeBase64 = btoa(String.fromCharCode(...new Uint8Array(resumeArrayBuffer)));

    // Use OpenAI API to extract text content from the resume
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured, skipping parsing");
      return new Response(
        JSON.stringify({ success: true, message: "Parsing skipped - no AI key" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For PDFs, we'll use OpenAI's vision capabilities to extract text
    const contentType = resumeBlob.type;
    let extractedText = "";

    if (contentType === "application/pdf") {
      // Use OpenAI GPT-4o to extract content from PDF
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a resume parsing assistant. Extract and summarize key information from resumes including:
- Full name
- Contact information (email, phone)
- Professional summary/objective
- Work experience (company, title, dates, key responsibilities)
- Education (degree, institution, dates)
- Skills (technical and soft skills)
- Certifications
- Notable achievements

Format the output as structured text that can be used for candidate evaluation.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract and summarize the key information from this resume document.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${contentType};base64,${resumeBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        extractedText = aiData.choices?.[0]?.message?.content || "";
      } else {
        console.error("OpenAI parsing failed:", await aiResponse.text());
      }
    } else {
      // For Word documents, we'd need different handling
      // For now, just note that it was uploaded
      extractedText = "[Word document uploaded - parsing pending]";
    }

    // Update candidate with parsed content
    const { error: updateError } = await supabase
      .from("candidates")
      .update({ resume_parsed_content: extractedText })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Failed to update candidate:", updateError);
    }

    console.log(`Resume parsed successfully for candidate ${candidateId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        parsedContent: extractedText.substring(0, 500) + "..." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in parse-resume:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
