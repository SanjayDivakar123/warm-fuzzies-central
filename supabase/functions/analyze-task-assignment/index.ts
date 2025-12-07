import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  q1: ['yellow', 'red'], // Action and communication for crisis
  q2: ['blue', 'green'], // Strategy and analysis for planning
  q3: ['yellow', 'green'], // Execution and systems for delegation
  q4: ['green'] // Systems to identify what to eliminate
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
    const { taskId, companyId, title, description, quadrant, importance, urgency, skills, department } = await req.json();

    console.log('Analyzing task assignment:', { taskId, companyId, title, quadrant });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all employees with completed assessments, including job_role and skills
    const { data: employees, error: empError } = await supabase
      .from('company_users')
      .select('id, email, role, status, assessment_result_id, job_role, skills')
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
          quadrantExplanation: quadrantDescriptions[quadrant as keyof typeof quadrantDescriptions],
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
    const { data: assignedTasks } = await supabase
      .from('work_tasks')
      .select('id')
      .eq('company_id', companyId)
      .in('status', ['pending', 'assigned', 'in_progress']);

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

    const maxTasks = Math.max(...Object.values(taskCountByEmployee), 5); // At least 5 for normalization

    // Determine best RoleColor for the task based on quadrant
    const preferredColors = quadrantToColors[quadrant as keyof typeof quadrantToColors] || ['yellow'];
    const recommendedColor = preferredColors[0];

    // Prepare task text for matching
    const taskText = `${title} ${description} ${(skills || []).join(' ')} ${department || ''}`.toLowerCase();
    const taskSkillsArray = (skills || []).map((s: string) => s.toLowerCase());

    // Score each employee
    const scoredEmployees = employeesWithResults.map(emp => {
      const results = emp.assessmentResults as any;
      const dominantColor = results?.dominantColor?.toLowerCase() || 'unknown';
      const colorScores = {
        yellow: results?.colorScores?.yellow || results?.scores?.yellow || 0,
        red: results?.colorScores?.red || results?.scores?.red || 0,
        green: results?.colorScores?.green || results?.scores?.green || 0,
        blue: results?.colorScores?.blue || results?.scores?.blue || 0
      };

      // Calculate RoleColor match score (0-1)
      let roleColorScore = 0;
      if (preferredColors.includes(dominantColor)) {
        roleColorScore = 1;
      } else {
        // Partial credit for secondary color alignment
        const totalScore = Object.values(colorScores).reduce((a, b) => a + b, 0);
        if (totalScore > 0) {
          roleColorScore = preferredColors.reduce((sum, color) => {
            return sum + (colorScores[color as keyof typeof colorScores] / totalScore);
          }, 0);
        }
      }

      // Job role fit - match job role to task keywords
      let jobRoleFit = 0.5;
      const employeeJobRole = emp.job_role || '';
      const jobKeywords = jobRoleKeywords[employeeJobRole] || [];
      
      if (employeeJobRole) {
        const matchingKeywords = jobKeywords.filter(keyword => taskText.includes(keyword));
        if (matchingKeywords.length > 0) {
          jobRoleFit = Math.min(1, 0.5 + matchingKeywords.length * 0.15);
        }
        
        // Boost for quadrant alignment
        if (quadrant === 'q2' && emp.role === 'admin') {
          jobRoleFit = Math.min(1, jobRoleFit + 0.15);
        } else if (quadrant === 'q3' && emp.role === 'employee') {
          jobRoleFit = Math.min(1, jobRoleFit + 0.1);
        }
      }

      // Skill match - compare employee skills to task skills
      let skillMatch = 0.4; // Base score
      const employeeSkills = (emp.skills || []).map((s: string) => s.toLowerCase());
      
      if (employeeSkills.length > 0 && taskSkillsArray.length > 0) {
        const matchingSkills = employeeSkills.filter((skill: string) => 
          taskSkillsArray.some((taskSkill: string) => 
            skill.includes(taskSkill) || taskSkill.includes(skill)
          )
        );
        skillMatch = Math.min(1, 0.4 + (matchingSkills.length / taskSkillsArray.length) * 0.6);
      } else if (employeeSkills.length > 0) {
        // Match skills to task description
        const skillsInDescription = employeeSkills.filter((skill: string) => 
          taskText.includes(skill)
        );
        skillMatch = Math.min(1, 0.4 + skillsInDescription.length * 0.15);
      }

      // Also check RoleColor traits against task
      const colorTraits = roleColorDefinitions[dominantColor as keyof typeof roleColorDefinitions];
      if (colorTraits) {
        const matchingTraits = colorTraits.traits.filter(trait => taskText.includes(trait.toLowerCase()));
        const matchingTypes = colorTraits.taskTypes.filter(type => taskText.includes(type.toLowerCase()));
        skillMatch = Math.min(1, skillMatch + (matchingTraits.length + matchingTypes.length) * 0.05);
      }

      // Real workload margin based on assigned tasks
      const employeeTaskCount = taskCountByEmployee[emp.id] || 0;
      const workloadMargin = Math.max(0.2, 1 - (employeeTaskCount / maxTasks));

      // Past success (still simulated - would need historical outcome data)
      const pastSuccess = 0.6;

      // Behavioral suitability based on color match
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

    const primaryAssignee = scoredEmployees[0] || null;
    const secondaryAssignee = scoredEmployees[1] || null;

    // Generate reasoning with real data
    const reasoning = {
      quadrantExplanation: `This task falls into ${quadrantDescriptions[quadrant as keyof typeof quadrantDescriptions]}. ${
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

    console.log('Assignment complete. Primary:', primaryAssignee?.email, 'Score:', primaryAssignee?.totalScore);

    return new Response(JSON.stringify({
      primaryAssignee: primaryAssignee ? { 
        id: primaryAssignee.id, 
        email: primaryAssignee.email, 
        dominantColor: primaryAssignee.dominantColor,
        job_role: primaryAssignee.job_role,
        skills: primaryAssignee.skills
      } : null,
      secondaryAssignee: secondaryAssignee ? { 
        id: secondaryAssignee.id, 
        email: secondaryAssignee.email, 
        dominantColor: secondaryAssignee.dominantColor,
        job_role: secondaryAssignee.job_role,
        skills: secondaryAssignee.skills
      } : null,
      reasoning,
      score: primaryAssignee?.totalScore || 0,
      allCandidates: scoredEmployees.map(e => ({
        id: e.id,
        email: e.email,
        dominantColor: e.dominantColor,
        job_role: e.job_role,
        skills: e.skills,
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