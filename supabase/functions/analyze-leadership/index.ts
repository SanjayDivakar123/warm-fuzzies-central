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

Generate a JSON response with:
1. profileSummary: ${isStudent ? '2-3 paragraphs explaining their leadership style in group work' : '2-3 paragraphs analyzing their professional leadership style'}
2. leadershipStage: One of [Starting Leader, Developing Leader, Confident Leader, Collaborative Leader, Adaptive Leader]
3. stageDescription: 2 sentences about their current stage
4. growthPlan: Array of ${is50Question ? '5' : '3'} actionable items focused on ${isStudent ? 'school, clubs, sports, group projects' : 'classroom, school leadership, professional development'}
5. teamFitInsight: 2 sentences about collaboration strengths

Keep language ${isStudent ? 'energizing and relatable' : 'professional and insightful'}.`;

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
    const analysis = JSON.parse(content);

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
