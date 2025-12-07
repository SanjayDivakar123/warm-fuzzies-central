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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, companyId, title, description, quadrant, importance, urgency, skills, department } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all employees with completed assessments
    const { data: employees, error: empError } = await supabase
      .from('company_users')
      .select('id, email, role, status, assessment_result_id')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .not('assessment_result_id', 'is', null);

    if (empError) {
      console.error('Error fetching employees:', empError);
      throw empError;
    }

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

    // Determine best RoleColor for the task based on quadrant
    const preferredColors = quadrantToColors[quadrant as keyof typeof quadrantToColors] || ['yellow'];
    const recommendedColor = preferredColors[0];

    // Score each employee
    const scoredEmployees = employeesWithResults.map(emp => {
      const results = emp.assessmentResults as any;
      const dominantColor = results?.dominantColor?.toLowerCase() || 'unknown';
      const scores = {
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
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        if (totalScore > 0) {
          roleColorScore = preferredColors.reduce((sum, color) => {
            return sum + (scores[color as keyof typeof scores] / totalScore);
          }, 0);
        }
      }

      // Job role fit (admin vs employee - admins might be better for strategic tasks)
      let jobRoleFit = 0.5;
      if (quadrant === 'q2' && emp.role === 'admin') {
        jobRoleFit = 0.8;
      } else if (quadrant === 'q3' && emp.role === 'employee') {
        jobRoleFit = 0.8;
      } else {
        jobRoleFit = 0.6;
      }

      // Skill match (based on task description keywords)
      let skillMatch = 0.5;
      const taskText = `${title} ${description} ${skills?.join(' ') || ''}`.toLowerCase();
      const colorTraits = roleColorDefinitions[dominantColor as keyof typeof roleColorDefinitions];
      if (colorTraits) {
        const matchingTraits = colorTraits.traits.filter(trait => taskText.includes(trait.toLowerCase()));
        const matchingTypes = colorTraits.taskTypes.filter(type => taskText.includes(type.toLowerCase()));
        skillMatch = Math.min(1, 0.5 + (matchingTraits.length + matchingTypes.length) * 0.1);
      }

      // Workload margin (simulated - in real scenario, this would come from task count)
      const workloadMargin = 0.7; // Default availability

      // Past success (simulated - would need historical data)
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

      return {
        ...emp,
        dominantColor,
        scores,
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

    // Generate reasoning
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
        `Based on the task description${skills?.length ? ` and required skills (${skills.join(', ')})` : ''}, ${primaryAssignee.email} shows a ${Math.round(primaryAssignee.skillMatch * 100)}% skill alignment score.` :
        'Unable to determine skill match without candidates.',
      workloadConsiderations: primaryAssignee ?
        `Current workload assessment indicates ${Math.round(primaryAssignee.workloadMargin * 100)}% availability. ${
          primaryAssignee.workloadMargin > 0.7 ? 'This employee has capacity for new tasks.' :
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

    return new Response(JSON.stringify({
      primaryAssignee: primaryAssignee ? { id: primaryAssignee.id, email: primaryAssignee.email, dominantColor: primaryAssignee.dominantColor } : null,
      secondaryAssignee: secondaryAssignee ? { id: secondaryAssignee.id, email: secondaryAssignee.email, dominantColor: secondaryAssignee.dominantColor } : null,
      reasoning,
      score: primaryAssignee?.totalScore || 0
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
