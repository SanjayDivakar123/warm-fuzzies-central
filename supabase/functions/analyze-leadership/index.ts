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

CRITICAL RULE: Only discuss the PRIMARY and SECONDARY colors in your analysis. NEVER mention other colors beyond these two.

Tone: ${isStudent ? 'Friendly, direct, motivating for middle/high school students' : 'Professional but human for educators'}`;

    // Generate specific content based on assessment type
    let userPrompt = '';
    
    if (assessmentType === '50q-student') {
      userPrompt = `Primary: ${primaryColor}, Secondary: ${secondaryColor}, Scores: Y=${colorScores.Yellow}, R=${colorScores.Red}, G=${colorScores.Green}, B=${colorScores.Blue}

JSON fields: colorDescription (1 paragraph ONLY about ${primaryColor} and ${secondaryColor}), strengths (3-4 items), groupBehavior, communicationStyle, pressureHandling (2 sentences each), leadershipStage, stageDescription, growthPlan (5 strings), teamFitInsight (2 sentences about ${primaryColor} and ${secondaryColor} only), categoryInsights (object with keys: "Decision-Making", "Communication Style", "Team Dynamics", "Conflict Behavior", "Motivation Drivers", "Stress Behavior", "Collaboration", "Self-Management", each containing: explanation (1 simple sentence), schoolExample (1 sentence example from school life))`;
    } else if (assessmentType === '25q-student') {
      userPrompt = `Primary: ${primaryColor}, Secondary: ${secondaryColor}, Scores: Y=${colorScores.Yellow}, R=${colorScores.Red}, G=${colorScores.Green}, B=${colorScores.Blue}

JSON fields: colorDescription (1 paragraph ONLY about ${primaryColor} and ${secondaryColor}), strengths (3 items), growthAreas (2 items), decisionMaking, teamHelp, problemHandling (1 paragraph each), leadershipStage, growthPlan (3 strings starting with "One thing to try:", "One habit to build:", "One thing to avoid:")`;
    } else if (assessmentType === '50q-teacher') {
      userPrompt = `Primary: ${primaryColor}, Secondary: ${secondaryColor}, Scores: Y=${colorScores.Yellow}, R=${colorScores.Red}, G=${colorScores.Green}, B=${colorScores.Blue}

JSON fields: executiveSummary (3 sentences), strengths (4 items), blindSpots (2-3 items), teamLeadership, conflictHandling, stressReactions, motivators (2 sentences each), leadershipStage, stageDescription (3 sentences), behavioralIndicators (3 items), risks (2 items), opportunities (2 items), startDoing (2 items), stopDoing (2 items), continueDoing (2 items), thirtyDayActions (3 items), teamFitInsight (2 sentences), categoryInsights (object with keys: "Decision-Making", "Communication Style", "Team Dynamics", "Conflict Behavior", "Motivation Drivers", "Stress Behavior", "Collaboration", "Self-Management", each containing: interpretation (2 sentences), classroomExample (1 sentence), strength (1 sentence), watchOut (1 sentence))`;
    } else {
      userPrompt = `Primary: ${primaryColor}, Secondary: ${secondaryColor}, Scores: Y=${colorScores.Yellow}, R=${colorScores.Red}, G=${colorScores.Green}, B=${colorScores.Blue}

JSON fields: summary (2 sentences), strengths (3 items), watchOuts (3 items), colorProfile (1 paragraph), leadershipStage, stageDescription (2 sentences), condensedCategories (object with keys: "Communication", "Decision-Making", "Conflict", "Team Behavior", "Stress Style", each containing: score (number 0-100 based on color pattern), interpretation (1 paragraph school-context specific)), growthPlan (4 strings school-context specific)`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no additional text. Ensure all JSON arrays and objects are properly formatted with no trailing commas.' },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required.' }), {
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
    
    console.log('Raw AI response:', content);
    
    // Strip markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Additional cleaning: remove any trailing commas before closing braces/brackets
    cleanContent = cleanContent.replace(/,(\s*[}\]])/g, '$1');
    
    console.log('Cleaned content:', cleanContent);
    
    let analysis;
    try {
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', cleanContent);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
    
    // Ensure arrays are arrays of strings
    const ensureStringArray = (arr: any) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return item.item || item.text || item.action || JSON.stringify(item);
        }
        return String(item);
      });
    };

    if (analysis.growthPlan) analysis.growthPlan = ensureStringArray(analysis.growthPlan);
    if (analysis.strengths) analysis.strengths = ensureStringArray(analysis.strengths);
    if (analysis.growthAreas) analysis.growthAreas = ensureStringArray(analysis.growthAreas);

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
