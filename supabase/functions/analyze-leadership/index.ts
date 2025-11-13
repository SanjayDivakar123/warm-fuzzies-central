import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentType, colorScores, primaryColor, secondaryColor } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const isStudent = assessmentType.includes('student');
    const is50Question = assessmentType.includes('50q');
    
    const systemPrompt = `You are an expert in RCF Leadership Color Assessment analysis. Generate personalized, insightful content for ${isStudent ? 'students' : 'teachers'}.

RCF Leadership Colors:
- Red: Visionary and motivational leaders who inspire others
- Blue: Creative and innovative leaders who bring fresh ideas
- Yellow: Action-oriented leaders who drive execution and results
- Green: Analytical and structured leaders who solve problems logically

Leadership Stages (Tuckman's Stages):
- Forming → Yellow (action and structure)
- Storming → Red (vision and motivation)
- Norming → Blue (creativity and innovation)
- Performing → Green (analysis and optimization)
- Adapting → Adaptive Leader (blend of colors)

Tone: ${isStudent ? 'Friendly, direct, motivating for middle/high school students' : 'Professional but human for educators'}`;

    const userPrompt = `Generate content for a ${assessmentType} leadership assessment report.

Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}
Color Scores: Yellow=${colorScores.Yellow}/100, Red=${colorScores.Red}/100, Green=${colorScores.Green}/100, Blue=${colorScores.Blue}/100

Generate a JSON response with these exact fields:
1. profileSummary: ${isStudent ? '2-3 paragraphs explaining their leadership style in group work, written in a friendly and motivating tone' : '2-3 paragraphs analyzing their professional leadership style, written in a professional but human tone'}
2. leadershipStage: Based on their primary color, determine the stage:
   - Yellow (highest score) = "Forming Stage - The Executor"
   - Red (highest score) = "Storming Stage - The Motivator"  
   - Blue (highest score) = "Norming Stage - The Innovator"
   - Green (highest score) = "Performing Stage - The Analyst"
   - Balanced scores (within 15% of each other) = "Adapting Stage - The Adaptive Leader"
3. stageDescription: 2-3 sentences about their current stage and what it means
4. growthPlan: Array of exactly ${is50Question ? '5' : '3'} strings (NOT objects). Each string should be a complete actionable item focused on ${isStudent ? 'school, clubs, sports, and group projects' : 'classroom leadership, school culture, and professional development'}. Example: ["Try leading one small group activity this week", "Practice active listening in team discussions"]
5. teamFitInsight: 2 sentences about their collaboration strengths and how they work with others

CRITICAL: The growthPlan MUST be an array of strings, not objects. Each item should be a complete sentence starting with an action verb.

Keep language ${isStudent ? 'energizing, relatable, and age-appropriate for middle/high school students' : 'professional, insightful, and relevant for educators'}.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const analysis = JSON.parse(cleanContent);
    
    // Ensure growthPlan is an array of strings
    if (analysis.growthPlan && Array.isArray(analysis.growthPlan)) {
      analysis.growthPlan = analysis.growthPlan.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          // Extract string value from object if needed
          return item.item || item.text || item.action || JSON.stringify(item);
        }
        return String(item);
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-leadership:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
