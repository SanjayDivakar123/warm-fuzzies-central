import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { useContext } from "https://deno.land/x/next@v1.1.0/context.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRoleRequest {
  jobRole: string;
  teamSize?: number;
  responsibilities?: string;
}

interface RoleAnalysis {
  shouldTakeAssessment: boolean;
  recommendation: 'highly_recommended' | 'recommended' | 'optional' | 'not_recommended';
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  benefits: string[];
  suggestedCategory: 'professional' | 'entrepreneur' | 'executive' | 'manager';
  teamCollaborationScore: number; // 1-10
  leadershipComplexityScore: number; // 1-10
  selfAwarenessValueScore: number; // 1-10
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobRole, teamSize, responsibilities }: AnalyzeRoleRequest = await req.json();

    if (!jobRole || !jobRole.trim()) {
      return new Response(
        JSON.stringify({ error: 'Job role is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      // Fallback to rule-based analysis
      const analysis = analyzeRoleManually(jobRole, teamSize);
      return new Response(
        JSON.stringify({ ...analysis, aiAnalyzed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contextInfo = [
      teamSize ? `Team size: ${teamSize} people` : '',
      responsibilities ? `Key responsibilities: ${responsibilities}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `You are an HR and organizational psychology expert. Analyze this job role to determine if they would benefit from taking a RoleColor behavioral assessment.

The RoleColor assessment helps individuals understand their natural work style, communication preferences, and how they collaborate with others. It's particularly valuable for:
- Leaders who need to understand their team dynamics
- People who work closely with others
- Those in roles requiring self-awareness and emotional intelligence
- Team members in collaborative environments

Job Role: "${jobRole}"
${contextInfo ? `Additional Context:\n${contextInfo}` : ''}

Analyze this role and respond with ONLY valid JSON in this exact format:
{
  "shouldTakeAssessment": true/false,
  "recommendation": "highly_recommended" | "recommended" | "optional" | "not_recommended",
  "confidence": "high" | "medium" | "low",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "suggestedCategory": "professional" | "entrepreneur" | "executive" | "manager",
  "teamCollaborationScore": 1-10,
  "leadershipComplexityScore": 1-10,
  "selfAwarenessValueScore": 1-10
}

Consider:
1. Does this role involve leading or influencing others?
2. Does this role require significant collaboration?
3. Would understanding behavioral preferences help them perform better?
4. Would self-awareness benefit their work relationships?`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an HR and organizational psychology expert. Always respond with valid JSON only, no markdown formatting.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', await response.text());
      const analysis = analyzeRoleManually(jobRole, teamSize);
      return new Response(
        JSON.stringify({ ...analysis, aiAnalyzed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
      else if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);

      const parsed: RoleAnalysis = JSON.parse(cleanContent.trim());
      
      return new Response(
        JSON.stringify({ ...parsed, aiAnalyzed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      const analysis = analyzeRoleManually(jobRole, teamSize);
      return new Response(
        JSON.stringify({ ...analysis, aiAnalyzed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in analyze-role-assessment-need:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeRoleManually(jobRole: string, teamSize?: number): RoleAnalysis {
  const role = jobRole.toLowerCase();
  
  // Keywords for different categories
  const executiveKeywords = ['ceo', 'cfo', 'cto', 'coo', 'chief', 'president', 'vp', 'vice president', 'director', 'head of', 'svp', 'evp'];
  const managerKeywords = ['manager', 'supervisor', 'team lead', 'lead', 'coordinator', 'head', 'principal'];
  const entrepreneurKeywords = ['founder', 'owner', 'entrepreneur', 'partner', 'co-founder', 'startup'];
  const highCollabKeywords = ['consultant', 'account', 'sales', 'customer', 'support', 'hr', 'recruiter', 'trainer', 'coach', 'therapist', 'nurse', 'doctor', 'teacher'];
  const technicalSoloKeywords = ['developer', 'engineer', 'analyst', 'researcher', 'scientist', 'architect'];
  
  let teamCollaborationScore = 5;
  let leadershipComplexityScore = 3;
  let selfAwarenessValueScore = 6;
  let suggestedCategory: RoleAnalysis['suggestedCategory'] = 'professional';
  
  // Determine category and scores
  if (executiveKeywords.some(k => role.includes(k))) {
    suggestedCategory = 'executive';
    leadershipComplexityScore = 9;
    teamCollaborationScore = 8;
    selfAwarenessValueScore = 9;
  } else if (managerKeywords.some(k => role.includes(k))) {
    suggestedCategory = 'manager';
    leadershipComplexityScore = 7;
    teamCollaborationScore = 8;
    selfAwarenessValueScore = 8;
  } else if (entrepreneurKeywords.some(k => role.includes(k))) {
    suggestedCategory = 'entrepreneur';
    leadershipComplexityScore = 8;
    teamCollaborationScore = 7;
    selfAwarenessValueScore = 9;
  } else if (highCollabKeywords.some(k => role.includes(k))) {
    teamCollaborationScore = 8;
    selfAwarenessValueScore = 8;
  } else if (technicalSoloKeywords.some(k => role.includes(k))) {
    teamCollaborationScore = 5;
    selfAwarenessValueScore = 6;
  }
  
  // Adjust for team size
  if (teamSize && teamSize > 5) {
    teamCollaborationScore = Math.min(10, teamCollaborationScore + 1);
    leadershipComplexityScore = Math.min(10, leadershipComplexityScore + 1);
  }
  
  // Calculate overall score
  const overallScore = (teamCollaborationScore + leadershipComplexityScore + selfAwarenessValueScore) / 3;
  
  let recommendation: RoleAnalysis['recommendation'];
  let shouldTakeAssessment: boolean;
  
  if (overallScore >= 7.5) {
    recommendation = 'highly_recommended';
    shouldTakeAssessment = true;
  } else if (overallScore >= 6) {
    recommendation = 'recommended';
    shouldTakeAssessment = true;
  } else if (overallScore >= 4.5) {
    recommendation = 'optional';
    shouldTakeAssessment = true;
  } else {
    recommendation = 'not_recommended';
    shouldTakeAssessment = false;
  }
  
  const reasons: string[] = [];
  const benefits: string[] = [];
  
  if (leadershipComplexityScore >= 7) {
    reasons.push('Leadership roles benefit greatly from understanding behavioral styles');
    benefits.push('Better team leadership and delegation');
  }
  if (teamCollaborationScore >= 7) {
    reasons.push('High collaboration requirements make self-awareness crucial');
    benefits.push('Improved team communication and dynamics');
  }
  if (selfAwarenessValueScore >= 7) {
    reasons.push('Role success depends on interpersonal effectiveness');
    benefits.push('Enhanced self-awareness for better relationships');
  }
  
  if (reasons.length === 0) {
    if (shouldTakeAssessment) {
      reasons.push('Understanding work style can improve job satisfaction');
      benefits.push('Personal development and career growth insights');
    } else {
      reasons.push('Role has limited team interaction requirements');
    }
  }
  
  if (benefits.length < 2 && shouldTakeAssessment) {
    benefits.push('Understand natural strengths and potential blind spots');
    benefits.push('Better alignment with work responsibilities');
  }
  
  return {
    shouldTakeAssessment,
    recommendation,
    confidence: 'medium',
    reasons,
    benefits,
    suggestedCategory,
    teamCollaborationScore,
    leadershipComplexityScore,
    selfAwarenessValueScore,
  };
}
