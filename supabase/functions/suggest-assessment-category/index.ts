import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestCategoryRequest {
  jobRole: string;
  jobRoles?: string[]; // For bulk suggestions
}

interface CategorySuggestion {
  category: 'professional' | 'entrepreneur' | 'executive' | 'manager';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobRole, jobRoles }: SuggestCategoryRequest = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      // Fallback to rule-based detection
      if (jobRoles && jobRoles.length > 0) {
        const suggestions = jobRoles.map(role => detectCategoryManually(role));
        return new Response(
          JSON.stringify({ suggestions, aiAnalyzed: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ ...detectCategoryManually(jobRole), aiAnalyzed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle bulk requests
    if (jobRoles && jobRoles.length > 0) {
      const prompt = `You are an HR expert. For each job role/title, suggest the most appropriate behavioral assessment category.

Categories:
1. "professional" - General professionals, individual contributors, specialists, analysts
2. "entrepreneur" - Business owners, founders, startup roles, self-employed
3. "executive" - C-suite, VPs, Directors, Senior Leaders with strategic responsibilities
4. "manager" - Team leads, supervisors, department managers, mid-level managers

Job Roles to analyze:
${jobRoles.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

Respond ONLY with a valid JSON array where each item has:
{
  "jobRole": "original job role",
  "category": "professional|entrepreneur|executive|manager",
  "confidence": "high|medium|low",
  "reason": "brief explanation"
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an HR expert that suggests assessment categories based on job roles. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        console.error('AI gateway error:', await response.text());
        const suggestions = jobRoles.map(role => detectCategoryManually(role));
        return new Response(
          JSON.stringify({ suggestions, aiAnalyzed: false }),
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
        
        const parsed = JSON.parse(cleanContent.trim());
        return new Response(
          JSON.stringify({ suggestions: parsed, aiAnalyzed: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        const suggestions = jobRoles.map(role => detectCategoryManually(role));
        return new Response(
          JSON.stringify({ suggestions, aiAnalyzed: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Single job role request
    if (!jobRole) {
      return new Response(
        JSON.stringify({ error: 'Job role is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an HR expert. Based on the job role/title provided, suggest the most appropriate behavioral assessment category.

Categories:
1. "professional" - General professionals, individual contributors, specialists, analysts
2. "entrepreneur" - Business owners, founders, startup roles, self-employed
3. "executive" - C-suite, VPs, Directors, Senior Leaders with strategic responsibilities  
4. "manager" - Team leads, supervisors, department managers, mid-level managers

Job Role: "${jobRole}"

Respond ONLY with a valid JSON object (no markdown):
{
  "category": "professional|entrepreneur|executive|manager",
  "confidence": "high|medium|low",
  "reason": "brief explanation"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an HR expert that suggests assessment categories based on job roles. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('AI gateway error:', await response.text());
      return new Response(
        JSON.stringify({ ...detectCategoryManually(jobRole), aiAnalyzed: false }),
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
      
      const parsed = JSON.parse(cleanContent.trim());
      return new Response(
        JSON.stringify({ ...parsed, aiAnalyzed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ ...detectCategoryManually(jobRole), aiAnalyzed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error suggesting category:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to suggest category' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectCategoryManually(jobRole: string): CategorySuggestion & { jobRole: string } {
  const role = jobRole.toLowerCase();
  
  // Executive patterns
  const executivePatterns = ['ceo', 'cfo', 'cto', 'coo', 'cmo', 'chief', 'president', 'vp', 'vice president', 'director', 'head of', 'svp', 'evp', 'partner', 'principal'];
  for (const pattern of executivePatterns) {
    if (role.includes(pattern)) {
      return { jobRole, category: 'executive', confidence: 'medium', reason: 'Pattern matched executive-level title' };
    }
  }

  // Manager patterns
  const managerPatterns = ['manager', 'lead', 'supervisor', 'team lead', 'coordinator', 'superintendent', 'foreman'];
  for (const pattern of managerPatterns) {
    if (role.includes(pattern)) {
      return { jobRole, category: 'manager', confidence: 'medium', reason: 'Pattern matched management title' };
    }
  }

  // Entrepreneur patterns
  const entrepreneurPatterns = ['founder', 'owner', 'entrepreneur', 'co-founder', 'ceo', 'self-employed', 'freelance', 'consultant', 'sole proprietor'];
  for (const pattern of entrepreneurPatterns) {
    if (role.includes(pattern)) {
      return { jobRole, category: 'entrepreneur', confidence: 'medium', reason: 'Pattern matched entrepreneurial title' };
    }
  }

  // Default to professional
  return { jobRole, category: 'professional', confidence: 'low', reason: 'Default category for individual contributors' };
}
