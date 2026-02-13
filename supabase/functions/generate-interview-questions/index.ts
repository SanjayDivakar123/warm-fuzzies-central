import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COLOR_TRAITS: Record<string, { traits: string[]; strengths: string[]; questionFocus: string }> = {
  yellow: {
    traits: ['action-oriented', 'results-driven', 'decisive', 'competitive', 'efficient'],
    strengths: ['execution', 'speed', 'directness', 'productivity'],
    questionFocus: 'situations requiring quick decisions, achieving results under pressure, and driving projects to completion',
  },
  red: {
    traits: ['inspiring', 'persuasive', 'energetic', 'enthusiastic', 'influential'],
    strengths: ['motivation', 'leadership', 'communication', 'team building'],
    questionFocus: 'motivating others, handling team dynamics, presenting ideas, and leading through influence',
  },
  green: {
    traits: ['methodical', 'detail-oriented', 'reliable', 'systematic', 'patient'],
    strengths: ['organization', 'consistency', 'process improvement', 'accuracy'],
    questionFocus: 'managing processes, maintaining quality, handling complex details, and ensuring consistency',
  },
  blue: {
    traits: ['creative', 'strategic', 'analytical', 'innovative', 'visionary'],
    strengths: ['problem-solving', 'innovation', 'analysis', 'strategic thinking'],
    questionFocus: 'creative problem-solving, strategic planning, analyzing complex situations, and developing new ideas',
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { positionTitle, idealColor, additionalContext } = await req.json();

    if (!positionTitle || !idealColor) {
      return new Response(
        JSON.stringify({ error: "Position title and ideal color are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const colorInfo = COLOR_TRAITS[idealColor.toLowerCase()] || COLOR_TRAITS.blue;

    const systemPrompt = `You are an expert HR consultant specializing in behavioral interviewing. Generate interview questions that assess candidates for specific RoleColor traits.

RoleColor Framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive
- Red (Motivator): Inspiring, persuasive, energetic, team-focused
- Green (Organizer): Methodical, detail-oriented, reliable, systematic  
- Blue (Innovator): Creative, strategic, analytical, visionary

LEADERSHIP INSIGHT: The best leaders have Red and/or Yellow as their PRIMARY or SECONDARY colors. Look for candidates who demonstrate both action/execution AND motivation/inspiration abilities.`;

    const userPrompt = `Generate 5 behavioral interview questions for a ${positionTitle} position.

Target RoleColor: ${idealColor.charAt(0).toUpperCase() + idealColor.slice(1)}
Color Traits: ${colorInfo.traits.join(', ')}
Key Strengths: ${colorInfo.strengths.join(', ')}
Focus Areas: ${colorInfo.questionFocus}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

For each question, provide:
1. The interview question (behavioral, using STAR format prompts)
2. Purpose (what trait/skill it assesses)
3. Ideal response characteristics (what to look for)
4. Color alignment (which RoleColor trait it targets)

Return a JSON object with a "questions" array containing objects with: question, purpose, idealResponse, colorAlignment`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let questions;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      const parsed = JSON.parse(jsonStr);
      questions = parsed.questions || parsed;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Generate fallback questions
      questions = [
        {
          question: `Tell me about a time when you had to ${colorInfo.questionFocus.split(',')[0].toLowerCase()}.`,
          purpose: `Assess ${colorInfo.traits[0]} capabilities`,
          idealResponse: `Look for examples demonstrating ${colorInfo.strengths[0]} and ${colorInfo.strengths[1]}`,
          colorAlignment: idealColor.charAt(0).toUpperCase() + idealColor.slice(1),
        },
        {
          question: `Describe a situation where you demonstrated ${colorInfo.traits[1]} behavior in a challenging project.`,
          purpose: `Evaluate ${colorInfo.traits[1]} trait`,
          idealResponse: `Strong answers show ${colorInfo.strengths[1]} and problem-solving`,
          colorAlignment: idealColor.charAt(0).toUpperCase() + idealColor.slice(1),
        },
        {
          question: `How do you approach ${colorInfo.questionFocus.split(',')[1]?.trim() || 'complex challenges'}?`,
          purpose: `Understand work style and approach`,
          idealResponse: `Look for alignment with ${colorInfo.traits.slice(0, 3).join(', ')} traits`,
          colorAlignment: idealColor.charAt(0).toUpperCase() + idealColor.slice(1),
        },
      ];
    }

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate questions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
