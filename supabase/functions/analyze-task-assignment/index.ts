import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof str === 'string' && uuidRegex.test(str)
}

function sanitizeString(str: string, maxLength: number): string {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLength)
}

function isValidQuadrant(q: string): boolean {
  return ['q1', 'q2', 'q3', 'q4'].includes(q)
}

function isValidPriority(p: string): boolean {
  return ['high', 'medium', 'low'].includes(p)
}

// RoleColor definitions
const roleColorDefinitions = {
  yellow: { traits: ['action', 'execution', 'speed', 'results-driven', 'decisive'], taskTypes: ['urgent', 'deadline-driven', 'operational'] },
  red: { traits: ['communication', 'persuasion', 'creative direction', 'influence', 'motivation'], taskTypes: ['client-facing', 'presentations', 'marketing', 'sales'] },
  green: { traits: ['analysis', 'logic', 'systems', 'precision', 'detail-oriented'], taskTypes: ['data analysis', 'process improvement', 'technical', 'documentation'] },
  blue: { traits: ['strategy', 'vision', 'innovation', 'research', 'big-picture'], taskTypes: ['planning', 'research', 'innovation', 'strategic initiatives'] }
};

// Quadrant descriptions
const quadrantDescriptions = {
  q1: 'Important and Urgent - Requires immediate attention from someone who can act quickly and decisively',
  q2: 'Important but Not Urgent - Best suited for strategic thinkers who can plan and develop without time pressure',
  q3: 'Urgent but Not Important - Can be delegated to action-oriented team members',
  q4: 'Not Urgent and Not Important - Should be minimized or eliminated'
};

// Map quadrants to preferred RoleColors
const quadrantToColors = {
  q1: ['yellow', 'red'],
  q2: ['blue', 'green'],
  q3: ['yellow', 'green'],
  q4: ['green']
};

// Map job roles to task keywords for matching
const jobRoleKeywords: Record<string, string[]> = {
  'Engineer': ['coding', 'technical', 'development', 'software', 'bug', 'fix', 'implementation', 'backend', 'frontend', 'api'],
  'Designer': ['design', 'ui', 'ux', 'visual', 'mockup', 'prototype', 'layout', 'graphics', 'brand'],
  'PM': ['project', 'planning', 'timeline', 'coordination', 'stakeholder', 'requirements', 'roadmap', 'sprint'],
  'Sales': ['sales', 'deal', 'prospect', 'client', 'revenue', 'pipeline', 'closing', 'negotiation'],
  'Support': ['support', 'help', 'ticket', 'customer', 'issue', 'resolve', 'troubleshoot'],
  'Analyst': ['analysis', 'data', 'report', 'metrics', 'insights', 'dashboard', 'statistics'],
  'Marketing': ['marketing', 'campaign', 'content', 'social', 'brand', 'advertising', 'promotion'],
  'Founder': ['strategy', 'vision', 'leadership', 'decision', 'direction', 'growth'],
  'Intern': ['learn', 'assist', 'support', 'help', 'basic', 'simple'],
  'Operations': ['operations', 'process', 'efficiency', 'workflow', 'logistics', 'coordination'],
  'QA': ['testing', 'quality', 'bug', 'validation', 'verification', 'test cases'],
  'Writer': ['writing', 'content', 'copy', 'documentation', 'blog', 'article', 'editing'],
  'Researcher': ['research', 'study', 'analysis', 'findings', 'investigation', 'discovery']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    // Create client with user's JWT to verify authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    let { taskId, companyId, title, description, quadrant, importance, urgency, skills, department } = body;

    // Input validation
    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(companyId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid company ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (taskId && !isValidUUID(taskId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid task ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize string inputs
    title = sanitizeString(title || '', 200);
    description = sanitizeString(description || '', 2000);
    department = sanitizeString(department || '', 100);

    // Validate enums
    if (quadrant && !isValidQuadrant(quadrant)) {
      quadrant = 'q4'; // Default fallback
    }

    if (importance && !isValidPriority(importance)) {
      importance = 'medium';
    }

    if (urgency && !isValidPriority(urgency)) {
      urgency = 'medium';
    }

    // Validate skills array
    if (skills && Array.isArray(skills)) {
      skills = skills.slice(0, 20).map((s: unknown) => sanitizeString(String(s), 50));
    } else {
      skills = [];
    }

    // Create service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a company admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .maybeSingle();

    if (adminError || !adminCheck) {
      console.log('User is not a company admin for this company');
      return new Response(
        JSON.stringify({ error: 'Forbidden: You must be a company admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing task assignment:', { taskId, companyId, title, quadrant });

    // Fetch all employees with completed assessments
    const { data: employees, error: empError } = await supabase
      .from('company_users')
      .select('id, email, role, status, assessment_result_id, job_role, skills, full_name')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .not('assessment_result_id', 'is', null);

    if (empError) {
      console.error('Error fetching employees:', empError);
      throw empError;
    }

    console.log('Found employees:', employees?.length || 0);

    if (!employees || employees.length === 0) {
      return new Response(JSON.stringify({
        primaryAssignee: null,
        secondaryAssignee: null,
        reasoning: {
          quadrantExplanation: quadrantDescriptions[quadrant as keyof typeof quadrantDescriptions] || '',
          roleColorJustification: 'No employees with completed assessments found',
          skillMatchNotes: 'Unable to match skills without employee profiles',
          workloadConsiderations: 'No workload data available',
          behavioralReasoning: 'Cannot determine behavioral fit without assessment results'
        },
        score: 0,
        recommendedColor: quadrantToColors[quadrant as keyof typeof quadrantToColors]?.[0] || 'yellow'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch assessment results for each employee
    const employeesWithResults = [];
    for (const emp of employees) {
      if (emp.assessment_result_id) {
        const { data: result } = await supabase
          .from('assessment_results')
          .select('results')
          .eq('id', emp.assessment_result_id)
          .single();

        if (result?.results) {
          employeesWithResults.push({
            ...emp,
            assessmentResults: result.results
          });
        }
      }
    }

    // Calculate real workload from assigned tasks
    const { data: taskAssignments } = await supabase
      .from('task_assignments')
      .select('primary_assignee_id, secondary_assignee_id')
      .eq('company_id', companyId);

    // Count tasks per employee
    const taskCountByEmployee: Record<string, number> = {};
    taskAssignments?.forEach(assignment => {
      if (assignment.primary_assignee_id) {
        taskCountByEmployee[assignment.primary_assignee_id] = (taskCountByEmployee[assignment.primary_assignee_id] || 0) + 1;
      }
      if (assignment.secondary_assignee_id) {
        taskCountByEmployee[assignment.secondary_assignee_id] = (taskCountByEmployee[assignment.secondary_assignee_id] || 0) + 0.5;
      }
    });

    const maxTasks = Math.max(...Object.values(taskCountByEmployee), 5);

    // Determine best RoleColor for the task based on quadrant
    const preferredColors = quadrantToColors[quadrant as keyof typeof quadrantToColors] || ['yellow'];
    const recommendedColor = preferredColors[0];

    // Prepare task text for matching
    const taskText = `${title} ${description} ${skills.join(' ')} ${department}`.toLowerCase();
    const taskSkillsArray = skills.map((s: string) => s.toLowerCase());

    // Score each employee using algorithmic approach first
    const scoredEmployees = employeesWithResults.map(emp => {
      const results = emp.assessmentResults as Record<string, unknown>;
      const dominantColor = (results?.dominantColor as string)?.toLowerCase() || 'unknown';
      const colorScores = {
        yellow: (results?.colorScores as Record<string, number>)?.yellow || (results?.scores as Record<string, number>)?.yellow || 0,
        red: (results?.colorScores as Record<string, number>)?.red || (results?.scores as Record<string, number>)?.red || 0,
        green: (results?.colorScores as Record<string, number>)?.green || (results?.scores as Record<string, number>)?.green || 0,
        blue: (results?.colorScores as Record<string, number>)?.blue || (results?.scores as Record<string, number>)?.blue || 0
      };

      // Calculate RoleColor match score (0-1)
      let roleColorScore = 0;
      if (preferredColors.includes(dominantColor)) {
        roleColorScore = 1;
      } else {
        const totalScore = Object.values(colorScores).reduce((a, b) => a + b, 0);
        if (totalScore > 0) {
          roleColorScore = preferredColors.reduce((sum, color) => {
            return sum + (colorScores[color as keyof typeof colorScores] / totalScore);
          }, 0);
        }
      }

      // Job role fit
      let jobRoleFit = 0.5;
      const employeeJobRole = emp.job_role || '';
      const jobKeywords = jobRoleKeywords[employeeJobRole] || [];
      
      if (employeeJobRole) {
        const matchingKeywords = jobKeywords.filter(keyword => taskText.includes(keyword));
        if (matchingKeywords.length > 0) {
          jobRoleFit = Math.min(1, 0.5 + matchingKeywords.length * 0.15);
        }
        
        if (quadrant === 'q2' && emp.role === 'admin') {
          jobRoleFit = Math.min(1, jobRoleFit + 0.15);
        } else if (quadrant === 'q3' && emp.role === 'employee') {
          jobRoleFit = Math.min(1, jobRoleFit + 0.1);
        }
      }

      // Skill match
      let skillMatch = 0.4;
      const employeeSkills = (emp.skills || []).map((s: string) => s.toLowerCase());
      
      if (employeeSkills.length > 0 && taskSkillsArray.length > 0) {
        const matchingSkills = employeeSkills.filter((skill: string) => 
          taskSkillsArray.some((taskSkill: string) => 
            skill.includes(taskSkill) || taskSkill.includes(skill)
          )
        );
        skillMatch = Math.min(1, 0.4 + (matchingSkills.length / taskSkillsArray.length) * 0.6);
      } else if (employeeSkills.length > 0) {
        const skillsInDescription = employeeSkills.filter((skill: string) => 
          taskText.includes(skill)
        );
        skillMatch = Math.min(1, 0.4 + skillsInDescription.length * 0.15);
      }

      const colorTraits = roleColorDefinitions[dominantColor as keyof typeof roleColorDefinitions];
      if (colorTraits) {
        const matchingTraits = colorTraits.traits.filter(trait => taskText.includes(trait.toLowerCase()));
        const matchingTypes = colorTraits.taskTypes.filter(type => taskText.includes(type.toLowerCase()));
        skillMatch = Math.min(1, skillMatch + (matchingTraits.length + matchingTypes.length) * 0.05);
      }

      // Real workload margin
      const employeeTaskCount = taskCountByEmployee[emp.id] || 0;
      const workloadMargin = Math.max(0.2, 1 - (employeeTaskCount / maxTasks));

      // Past success (simulated)
      const pastSuccess = 0.6;

      // Behavioral suitability
      const behavioralSuitability = roleColorScore;

      // Calculate weighted score
      const totalScore = (
        roleColorScore * 0.25 +
        skillMatch * 0.2 +
        jobRoleFit * 0.15 +
        workloadMargin * 0.15 +
        pastSuccess * 0.1 +
        behavioralSuitability * 0.15
      );

      console.log(`Employee ${emp.email}: roleColor=${roleColorScore.toFixed(2)}, skill=${skillMatch.toFixed(2)}, jobRole=${jobRoleFit.toFixed(2)}, workload=${workloadMargin.toFixed(2)}, total=${totalScore.toFixed(2)}`);

      return {
        ...emp,
        dominantColor,
        colorScores,
        roleColorScore,
        skillMatch,
        jobRoleFit,
        workloadMargin,
        pastSuccess,
        behavioralSuitability,
        totalScore
      };
    });

    // Sort by total score
    scoredEmployees.sort((a, b) => b.totalScore - a.totalScore);

    let primaryAssignee = scoredEmployees[0] || null;
    let secondaryAssignee = scoredEmployees[1] || null;

    // Use OpenAI to generate enhanced reasoning if API key is available
    let reasoning: Record<string, string>;
    let aiEnhanced = false;

    if (OPENAI_API_KEY && primaryAssignee) {
      try {
        console.log('Using OpenAI to generate enhanced assignment reasoning...');
        
        const candidateSummary = scoredEmployees.slice(0, 5).map((emp, i) => {
          const totalColorScore = Object.values(emp.colorScores).reduce((a, b) => a + b, 0);
          const colorPercentages = {
            yellow: Math.round((emp.colorScores.yellow / totalColorScore) * 100),
            red: Math.round((emp.colorScores.red / totalColorScore) * 100),
            green: Math.round((emp.colorScores.green / totalColorScore) * 100),
            blue: Math.round((emp.colorScores.blue / totalColorScore) * 100),
          };
          return `${i + 1}. ${emp.full_name || emp.email}
   - Job Role: ${emp.job_role || 'Not specified'}
   - Skills: ${emp.skills?.join(', ') || 'None listed'}
   - Dominant Color: ${emp.dominantColor}
   - Color Distribution: Yellow:${colorPercentages.yellow}%, Red:${colorPercentages.red}%, Green:${colorPercentages.green}%, Blue:${colorPercentages.blue}%
   - Current Workload: ${taskCountByEmployee[emp.id] || 0} active tasks
   - Algorithm Score: ${(emp.totalScore * 100).toFixed(0)}%`;
        }).join('\n\n');

        const aiPrompt = `You are an expert at task assignment and team management. Analyze this task assignment decision and provide insightful reasoning.

TASK DETAILS:
- Title: ${title}
- Description: ${description || 'No description provided'}
- Priority: Importance=${importance}, Urgency=${urgency}
- Quadrant: ${quadrantDescriptions[quadrant as keyof typeof quadrantDescriptions] || quadrant}
- Required Skills: ${skills.join(', ') || 'None specified'}
- Department: ${department || 'Not specified'}

TOP CANDIDATES (ranked by algorithm):
${candidateSummary}

Based on the RoleColor framework:
- Yellow (Executor): Action-oriented, results-driven, decisive - best for urgent execution tasks
- Red (Motivator): People-focused, inspiring, communicative - best for client-facing and team coordination
- Green (Organizer): Systematic, detail-oriented, reliable - best for analytical and process tasks
- Blue (Innovator): Strategic, visionary, creative - best for planning and innovation tasks

The algorithm recommends "${primaryAssignee.full_name || primaryAssignee.email}" as primary and "${secondaryAssignee?.full_name || secondaryAssignee?.email || 'none'}" as backup.

Provide your analysis in this exact JSON format:
{
  "quadrantExplanation": "1-2 sentences explaining why this task priority level affects who should handle it",
  "roleColorJustification": "2-3 sentences explaining why the primary assignee's RoleColor profile makes them ideal for this task. Be specific about their color traits.",
  "skillMatchNotes": "1-2 sentences about how the candidate's skills align with the task requirements",
  "workloadConsiderations": "1 sentence about the candidate's current capacity",
  "behavioralReasoning": "2 sentences about how the candidate's behavioral style will help them succeed with this task"
}

Return ONLY the JSON object, no additional text.`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "user", content: aiPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          if (content) {
            let cleanContent = content.trim();
            if (cleanContent.startsWith("```json")) {
              cleanContent = cleanContent.slice(7);
            } else if (cleanContent.startsWith("```")) {
              cleanContent = cleanContent.slice(3);
            }
            if (cleanContent.endsWith("```")) {
              cleanContent = cleanContent.slice(0, -3);
            }
            cleanContent = cleanContent.trim();

            const aiReasoning = JSON.parse(cleanContent);
            reasoning = {
              ...aiReasoning,
              recommendedColor
            };
            aiEnhanced = true;
            console.log('Successfully generated AI-enhanced reasoning');
          }
        } else {
          console.log('OpenAI API error, falling back to algorithmic reasoning:', aiResponse.status);
        }
      } catch (aiError) {
        console.error('Error with OpenAI reasoning, using fallback:', aiError);
      }
    }

    // Fallback to algorithmic reasoning if AI not available or failed
    if (!aiEnhanced) {
      reasoning = {
        quadrantExplanation: `This task falls into ${quadrantDescriptions[quadrant as keyof typeof quadrantDescriptions] || 'unknown quadrant'}. ${
          quadrant === 'q1' ? 'It requires someone who can execute quickly under pressure.' :
          quadrant === 'q2' ? 'This allows for thoughtful planning and strategic approach.' :
          quadrant === 'q3' ? 'This can be delegated to free up time for more important work.' :
          'Consider whether this task is necessary or can be eliminated.'
        }`,
        roleColorJustification: primaryAssignee ? 
          `${primaryAssignee.email} has a ${primaryAssignee.dominantColor} profile, which ${
            preferredColors.includes(primaryAssignee.dominantColor) 
              ? `aligns well with the task requirements. ${roleColorDefinitions[primaryAssignee.dominantColor as keyof typeof roleColorDefinitions]?.traits.join(', ')} are key strengths.`
              : `provides a different perspective. While ${recommendedColor} might be ideal, ${primaryAssignee.dominantColor} brings ${roleColorDefinitions[primaryAssignee.dominantColor as keyof typeof roleColorDefinitions]?.traits.slice(0, 2).join(' and ')}.`
          }` : 'No suitable candidate found based on RoleColor alignment.',
        skillMatchNotes: primaryAssignee ?
          `${primaryAssignee.email}${primaryAssignee.job_role ? ` (${primaryAssignee.job_role})` : ''} shows a ${Math.round(primaryAssignee.skillMatch * 100)}% skill alignment.${
            primaryAssignee.skills?.length ? ` Their skills include: ${primaryAssignee.skills.slice(0, 3).join(', ')}${primaryAssignee.skills.length > 3 ? '...' : ''}.` : ''
          }${skills?.length ? ` Task requires: ${skills.join(', ')}.` : ''}` :
          'Unable to determine skill match without candidates.',
        workloadConsiderations: primaryAssignee ?
          `Current workload: ${Math.round((1 - primaryAssignee.workloadMargin) * 100)}% capacity (${taskCountByEmployee[primaryAssignee.id] || 0} active tasks). ${
            primaryAssignee.workloadMargin > 0.7 ? 'This employee has good capacity for new tasks.' :
            primaryAssignee.workloadMargin > 0.4 ? 'Moderate workload - can handle additional tasks with proper prioritization.' :
            'High current workload - consider secondary candidate or task scheduling.'
          }` : 'No workload data available.',
        behavioralReasoning: primaryAssignee ?
          `${primaryAssignee.dominantColor.charAt(0).toUpperCase() + primaryAssignee.dominantColor.slice(1)} personalities tend to ${
            primaryAssignee.dominantColor === 'yellow' ? 'drive results and execute quickly, ideal for action-oriented tasks.' :
            primaryAssignee.dominantColor === 'red' ? 'communicate effectively and inspire others, great for collaborative or client-facing work.' :
            primaryAssignee.dominantColor === 'green' ? 'analyze thoroughly and maintain precision, perfect for detail-oriented tasks.' :
            'think strategically and innovate, excellent for planning and research tasks.'
          }` : 'Cannot assess behavioral fit without completed assessments.',
        recommendedColor
      };
    }

    console.log('Assignment complete. Primary:', primaryAssignee?.email, 'Score:', primaryAssignee?.totalScore, 'AI Enhanced:', aiEnhanced);

    return new Response(JSON.stringify({
      primaryAssignee: primaryAssignee ? { 
        id: primaryAssignee.id, 
        email: primaryAssignee.email, 
        dominantColor: primaryAssignee.dominantColor,
        job_role: primaryAssignee.job_role,
        skills: primaryAssignee.skills,
        full_name: primaryAssignee.full_name
      } : null,
      secondaryAssignee: secondaryAssignee ? { 
        id: secondaryAssignee.id, 
        email: secondaryAssignee.email, 
        dominantColor: secondaryAssignee.dominantColor,
        job_role: secondaryAssignee.job_role,
        skills: secondaryAssignee.skills,
        full_name: secondaryAssignee.full_name
      } : null,
      reasoning,
      score: primaryAssignee?.totalScore || 0,
      aiEnhanced,
      allCandidates: scoredEmployees.map(e => ({
        id: e.id,
        email: e.email,
        dominantColor: e.dominantColor,
        job_role: e.job_role,
        skills: e.skills,
        full_name: e.full_name,
        totalScore: e.totalScore,
        scores: {
          roleColor: e.roleColorScore,
          skill: e.skillMatch,
          jobRole: e.jobRoleFit,
          workload: e.workloadMargin,
          behavioral: e.behavioralSuitability
        }
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-task-assignment:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
