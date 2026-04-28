import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 50 Professional Assessment Questions
const questions = [
  { id: 1, section: "Leadership & Initiative", question: "When starting a new project, this person usually…", options: [{ text: "Breaks tasks into actions and moves forward immediately", color: "yellow" }, { text: "Shares the vision and inspires the team", color: "red" }, { text: "Builds a step-by-step structure", color: "green" }, { text: "Brainstorms innovative approaches before starting", color: "blue" }] },
  { id: 2, section: "Leadership & Initiative", question: "This person believes the best leaders…", options: [{ text: "Drive results through action", color: "yellow" }, { text: "Inspire with passion and communication", color: "red" }, { text: "Create clarity through logic and organization", color: "green" }, { text: "Push innovation and reimagine possibilities", color: "blue" }] },
  { id: 3, section: "Leadership & Initiative", question: "When a deadline is approaching, this person…", options: [{ text: "Pushes to get things done quickly", color: "yellow" }, { text: "Rallies the team with energy and motivation", color: "red" }, { text: "Re-prioritizes tasks logically", color: "green" }, { text: "Finds creative ways to meet the goal", color: "blue" }] },
  { id: 4, section: "Leadership & Initiative", question: "This person feels most accomplished when…", options: [{ text: "A project is executed successfully", color: "yellow" }, { text: "People are inspired by their work", color: "red" }, { text: "Processes are optimized and efficient", color: "green" }, { text: "Something new and original is created", color: "blue" }] },
  { id: 5, section: "Leadership & Initiative", question: "Colleagues usually describe this person as…", options: [{ text: "The one who makes things happen", color: "yellow" }, { text: "The one who lifts morale and inspires", color: "red" }, { text: "The one who keeps things organized", color: "green" }, { text: "The one who brings creative ideas", color: "blue" }] },
  { id: 6, section: "Leadership & Initiative", question: "In leadership, this person values most…", options: [{ text: "Efficiency and action", color: "yellow" }, { text: "Energy and vision", color: "red" }, { text: "Structure and clarity", color: "green" }, { text: "Innovation and experimentation", color: "blue" }] },
  { id: 7, section: "Leadership & Initiative", question: "When others are uncertain, this person…", options: [{ text: "Decides quickly and acts", color: "yellow" }, { text: "Encourages them with positivity", color: "red" }, { text: "Provides data and logic", color: "green" }, { text: "Suggests new ways forward", color: "blue" }] },
  { id: 8, section: "Leadership & Initiative", question: "This person's natural instinct is to…", options: [{ text: "Act first and adjust later", color: "yellow" }, { text: "Inspire with stories and energy", color: "red" }, { text: "Analyze carefully before moving ahead", color: "green" }, { text: "Explore new, unconventional ideas", color: "blue" }] },
  { id: 9, section: "Leadership & Initiative", question: "For this person, success in leadership means…", options: [{ text: "Achieving results consistently", color: "yellow" }, { text: "Motivating people to reach their best", color: "red" }, { text: "Building reliable systems", color: "green" }, { text: "Creating a culture of innovation", color: "blue" }] },
  { id: 10, section: "Leadership & Initiative", question: "When a project begins, this person focuses on…", options: [{ text: "Defining immediate next steps", color: "yellow" }, { text: "Sharing the vision and purpose", color: "red" }, { text: "Establishing structure and timelines", color: "green" }, { text: "Designing creative strategies to differentiate", color: "blue" }] },
  { id: 11, section: "Collaboration & Communication", question: "In team discussions, this person…", options: [{ text: "Pushes for decisions and action", color: "yellow" }, { text: "Motivates others with energy", color: "red" }, { text: "Clarifies details and organizes thoughts", color: "green" }, { text: "Asks innovative, 'what if' questions", color: "blue" }] },
  { id: 12, section: "Collaboration & Communication", question: "Teammates rely on this person to…", options: [{ text: "Get things done under pressure", color: "yellow" }, { text: "Inspire and energize the group", color: "red" }, { text: "Keep the project on track and structured", color: "green" }, { text: "Spot creative opportunities", color: "blue" }] },
  { id: 13, section: "Collaboration & Communication", question: "This person's communication style is…", options: [{ text: "Direct and action-oriented", color: "yellow" }, { text: "Enthusiastic and persuasive", color: "red" }, { text: "Precise and logical", color: "green" }, { text: "Conceptual and forward-looking", color: "blue" }] },
  { id: 14, section: "Collaboration & Communication", question: "If conflict arises, this person…", options: [{ text: "Pushes toward a fast resolution", color: "yellow" }, { text: "Uses positivity to bring people together", color: "red" }, { text: "Analyzes both perspectives logically", color: "green" }, { text: "Reframes with a creative solution", color: "blue" }] },
  { id: 15, section: "Collaboration & Communication", question: "This person contributes best when…", options: [{ text: "Driving projects into action", color: "yellow" }, { text: "Inspiring people toward goals", color: "red" }, { text: "Creating order and clarity", color: "green" }, { text: "Bringing fresh, creative ideas", color: "blue" }] },
  { id: 16, section: "Collaboration & Communication", question: "Colleagues count on this person for…", options: [{ text: "Speed and reliability", color: "yellow" }, { text: "Enthusiasm and morale-boosting", color: "red" }, { text: "Accuracy and structure", color: "green" }, { text: "Vision and creative problem-solving", color: "blue" }] },
  { id: 17, section: "Collaboration & Communication", question: "This person dislikes when team members…", options: [{ text: "Waste time without acting", color: "yellow" }, { text: "Lack energy or motivation", color: "red" }, { text: "Ignore important details", color: "green" }, { text: "Resist new ideas", color: "blue" }] },
  { id: 18, section: "Collaboration & Communication", question: "In presentations, this person prefers to…", options: [{ text: "Share results and progress", color: "yellow" }, { text: "Inspire the audience with passion", color: "red" }, { text: "Explain the logic and data clearly", color: "green" }, { text: "Highlight innovative, creative elements", color: "blue" }] },
  { id: 19, section: "Collaboration & Communication", question: "This person usually motivates colleagues by…", options: [{ text: "Showing momentum and results", color: "yellow" }, { text: "Sharing an inspiring vision", color: "red" }, { text: "Explaining clear steps", color: "green" }, { text: "Suggesting bold new directions", color: "blue" }] },
  { id: 20, section: "Collaboration & Communication", question: "This person's team role is often…", options: [{ text: "The driver", color: "yellow" }, { text: "The motivator", color: "red" }, { text: "The organizer", color: "green" }, { text: "The innovator", color: "blue" }] },
  { id: 21, section: "Problem-Solving & Decision-Making", question: "When solving problems, this person first…", options: [{ text: "Jumps into action to test solutions", color: "yellow" }, { text: "Motivates others to stay positive", color: "red" }, { text: "Breaks the issue into logical steps", color: "green" }, { text: "Explores alternative, creative options", color: "blue" }] },
  { id: 22, section: "Problem-Solving & Decision-Making", question: "This person's strength in decision-making is…", options: [{ text: "Acting quickly with confidence", color: "yellow" }, { text: "Persuading with energy and vision", color: "red" }, { text: "Using facts and analysis", color: "green" }, { text: "Reframing challenges innovatively", color: "blue" }] },
  { id: 23, section: "Problem-Solving & Decision-Making", question: "This person trusts decisions when…", options: [{ text: "They create fast results", color: "yellow" }, { text: "They inspire others", color: "red" }, { text: "They are supported by data", color: "green" }, { text: "They open new opportunities", color: "blue" }] },
  { id: 24, section: "Problem-Solving & Decision-Making", question: "When a mistake happens, this person…", options: [{ text: "Fixes it immediately and moves on", color: "yellow" }, { text: "Keeps morale high and encourages the team", color: "red" }, { text: "Analyzes carefully what went wrong", color: "green" }, { text: "Pivots into a new solution creatively", color: "blue" }] },
  { id: 25, section: "Problem-Solving & Decision-Making", question: "In high-pressure situations, this person…", options: [{ text: "Takes control and pushes forward", color: "yellow" }, { text: "Motivates others to stay calm and positive", color: "red" }, { text: "Focuses on logic and steps", color: "green" }, { text: "Looks for unconventional alternatives", color: "blue" }] },
  { id: 26, section: "Problem-Solving & Decision-Making", question: "This person prefers instructions that are…", options: [{ text: "Clear and actionable", color: "yellow" }, { text: "Inspirational and people-centered", color: "red" }, { text: "Detailed and systematic", color: "green" }, { text: "Flexible and open-ended", color: "blue" }] },
  { id: 27, section: "Problem-Solving & Decision-Making", question: "This person measures success by…", options: [{ text: "Achieving tangible results", color: "yellow" }, { text: "Inspiring and influencing people", color: "red" }, { text: "Accuracy and effectiveness", color: "green" }, { text: "Originality and innovation", color: "blue" }] },
  { id: 28, section: "Problem-Solving & Decision-Making", question: "In decision-making groups, this person…", options: [{ text: "Pushes for fast decisions", color: "yellow" }, { text: "Advocates passionately for ideas", color: "red" }, { text: "Provides logic and structure", color: "green" }, { text: "Introduces new perspectives", color: "blue" }] },
  { id: 29, section: "Problem-Solving & Decision-Making", question: "If their idea fails, this person…", options: [{ text: "Tries something else quickly", color: "yellow" }, { text: "Keeps others motivated to try again", color: "red" }, { text: "Reanalyzes carefully", color: "green" }, { text: "Redesigns the idea innovatively", color: "blue" }] },
  { id: 30, section: "Problem-Solving & Decision-Making", question: "This person's biggest contribution in problem-solving is…", options: [{ text: "Speed and determination", color: "yellow" }, { text: "Inspiration and communication", color: "red" }, { text: "Structure and clarity", color: "green" }, { text: "Creativity and originality", color: "blue" }] },
  { id: 31, section: "Adaptability & Innovation", question: "This person handles unexpected changes by…", options: [{ text: "Acting quickly to adjust", color: "yellow" }, { text: "Keeping the team positive", color: "red" }, { text: "Reworking plans step by step", color: "green" }, { text: "Pivoting to a new creative solution", color: "blue" }] },
  { id: 32, section: "Adaptability & Innovation", question: "This person learns best when…", options: [{ text: "They can apply it right away", color: "yellow" }, { text: "It connects to people and purpose", color: "red" }, { text: "It's structured and systematic", color: "green" }, { text: "It's open to creative exploration", color: "blue" }] },
  { id: 33, section: "Adaptability & Innovation", question: "This person enjoys projects that are…", options: [{ text: "Fast-paced and goal-driven", color: "yellow" }, { text: "Inspiring and people-focused", color: "red" }, { text: "Structured and methodical", color: "green" }, { text: "Open-ended and innovative", color: "blue" }] },
  { id: 34, section: "Adaptability & Innovation", question: "This person stays motivated when…", options: [{ text: "Progress is visible", color: "yellow" }, { text: "The energy around them is high", color: "red" }, { text: "The work is organized logically", color: "green" }, { text: "They get to innovate and create", color: "blue" }] },
  { id: 35, section: "Adaptability & Innovation", question: "This person's adaptability comes from…", options: [{ text: "Taking decisive action", color: "yellow" }, { text: "Staying optimistic and encouraging others", color: "red" }, { text: "Adjusting logically step by step", color: "green" }, { text: "Rethinking situations creatively", color: "blue" }] },
  { id: 36, section: "Adaptability & Innovation", question: "When trying new methods, this person…", options: [{ text: "Tests them quickly in practice", color: "yellow" }, { text: "Shares enthusiasm to get buy-in", color: "red" }, { text: "Researches carefully before implementing", color: "green" }, { text: "Experiments and sees what happens", color: "blue" }] },
  { id: 37, section: "Adaptability & Innovation", question: "This person is most energized by…", options: [{ text: "Momentum and results", color: "yellow" }, { text: "Passion and connection", color: "red" }, { text: "Order and structure", color: "green" }, { text: "Creativity and vision", color: "blue" }] },
  { id: 38, section: "Adaptability & Innovation", question: "If a plan fails, this person…", options: [{ text: "Acts fast to try a new one", color: "yellow" }, { text: "Motivates others not to give up", color: "red" }, { text: "Re-plans carefully", color: "green" }, { text: "Invents an alternative", color: "blue" }] },
  { id: 39, section: "Adaptability & Innovation", question: "The workplace projects this person enjoys most are…", options: [{ text: "Execution-focused", color: "yellow" }, { text: "People-centered and energizing", color: "red" }, { text: "Structured and organized", color: "green" }, { text: "Innovative and exploratory", color: "blue" }] },
  { id: 40, section: "Adaptability & Innovation", question: "This person thrives when they can…", options: [{ text: "Take decisive action", color: "yellow" }, { text: "Inspire and influence others", color: "red" }, { text: "Organize systems and processes", color: "green" }, { text: "Create and innovate freely", color: "blue" }] },
  { id: 41, section: "Self-Awareness & Reflection", question: "This person's biggest strength is…", options: [{ text: "Taking action and execution", color: "yellow" }, { text: "Inspiring others", color: "red" }, { text: "Logical problem-solving", color: "green" }, { text: "Creative thinking", color: "blue" }] },
  { id: 42, section: "Self-Awareness & Reflection", question: "This person gets frustrated when…", options: [{ text: "Work stalls without action", color: "yellow" }, { text: "Energy and passion are missing", color: "red" }, { text: "Systems are unclear", color: "green" }, { text: "Innovation is shut down", color: "blue" }] },
  { id: 43, section: "Self-Awareness & Reflection", question: "This person measures their growth by…", options: [{ text: "The results they've achieved", color: "yellow" }, { text: "The people they've inspired", color: "red" }, { text: "The knowledge and skills they've built", color: "green" }, { text: "The innovations they've created", color: "blue" }] },
  { id: 44, section: "Self-Awareness & Reflection", question: "This person's leadership style is…", options: [{ text: "Action-driven", color: "yellow" }, { text: "Visionary and motivational", color: "red" }, { text: "Structured and logical", color: "green" }, { text: "Creative and future-focused", color: "blue" }] },
  { id: 45, section: "Self-Awareness & Reflection", question: "This person gains energy from…", options: [{ text: "Achieving milestones", color: "yellow" }, { text: "Connecting with and inspiring others", color: "red" }, { text: "Solving complex problems", color: "green" }, { text: "Imagining new possibilities", color: "blue" }] },
  { id: 46, section: "Self-Awareness & Reflection", question: "The hardest thing for this person is…", options: [{ text: "Waiting without acting", color: "yellow" }, { text: "Working without inspiration", color: "red" }, { text: "Functioning without structure", color: "green" }, { text: "Following rigid rules", color: "blue" }] },
  { id: 47, section: "Self-Awareness & Reflection", question: "This person's proudest professional moments come when…", options: [{ text: "They execute big wins", color: "yellow" }, { text: "They inspire and uplift others", color: "red" }, { text: "They solve complex challenges", color: "green" }, { text: "They innovate something new", color: "blue" }] },
  { id: 48, section: "Self-Awareness & Reflection", question: "Colleagues usually notice that this person…", options: [{ text: "Gets things moving quickly", color: "yellow" }, { text: "Brings energy and inspiration", color: "red" }, { text: "Keeps things organized", color: "green" }, { text: "Suggests creative ideas", color: "blue" }] },
  { id: 49, section: "Self-Awareness & Reflection", question: "This person's preferred role in a team is…", options: [{ text: "Driver", color: "yellow" }, { text: "Motivator", color: "red" }, { text: "Organizer", color: "green" }, { text: "Innovator", color: "blue" }] },
  { id: 50, section: "Self-Awareness & Reflection", question: "Ultimately, this person wants to be known as…", options: [{ text: "A doer who gets results", color: "yellow" }, { text: "A motivator who inspires people", color: "red" }, { text: "A thinker who builds order", color: "green" }, { text: "A creator who innovates the future", color: "blue" }] },
];

const colorData = {
  yellow: {
    name: "Fast Executor",
    emoji: "⚡",
    description: "A natural action-taker who thrives on getting things done quickly and efficiently.",
    traits: ["Decisive", "Results-driven", "Action-oriented", "Competitive"],
    strengths: ["Quick decision-making", "Strong execution", "Goal achievement", "Crisis leadership"],
    challenges: ["May overlook details", "Can be impatient with process", "Risk of burnout"],
    famousExamples: ["Elon Musk", "Gordon Ramsay", "Serena Williams", "Steve Jobs"],
  },
  red: {
    name: "Creative Motivator",
    emoji: "🔥",
    description: "An inspiring visionary who energizes others with innovative ideas and passionate leadership.",
    traits: ["Charismatic", "Innovative", "Enthusiastic", "Visionary"],
    strengths: ["Inspirational leadership", "Creative problem-solving", "Team motivation", "Vision casting"],
    challenges: ["May struggle with follow-through", "Can overlook practicalities", "Risk of overcommitment"],
    famousExamples: ["Oprah Winfrey", "Richard Branson", "Tony Stark (Iron Man)", "Will Smith"],
  },
  green: {
    name: "Logical Systems Thinker",
    emoji: "🧠",
    description: "A methodical strategist who excels at building systems and processes.",
    traits: ["Analytical", "Systematic", "Methodical", "Detail-oriented"],
    strengths: ["Strategic planning", "Systems thinking", "Process optimization", "Risk management"],
    challenges: ["May over-analyze", "Can be slow to decide", "Risk of analysis paralysis"],
    famousExamples: ["Bill Gates", "Sherlock Holmes", "Warren Buffett", "Spock (Star Trek)"],
  },
  blue: {
    name: "Empathetic Connector",
    emoji: "💙",
    description: "A natural relationship builder who creates harmony and brings out the best in people.",
    traits: ["Empathetic", "Supportive", "Collaborative", "Intuitive"],
    strengths: ["Team building", "Emotional intelligence", "Conflict resolution", "Culture creation"],
    challenges: ["May avoid conflict", "Can be too accommodating", "Risk of people-pleasing"],
    famousExamples: ["Princess Diana", "Mr. Rogers", "Keanu Reeves", "Ted Lasso"],
  },
};

function getCelebrityNameError(name: string) {
  const trimmed = name.trim();
  const letters = trimmed.replace(/[^\p{L}]/gu, "").toLowerCase();

  if (!trimmed) return "Celebrity name is required";
  if (trimmed.length < 3 || trimmed.length > 80) return "Use a real name between 3 and 80 characters";
  if (/^\d+$/.test(trimmed)) return "Names cannot be only numbers";
  if (!/^[\p{L}\p{N} .,'-:]+$/u.test(trimmed)) return "Use a name, not symbols or a URL";
  if (letters.length < 2 || /^(\p{L})\1+$/u.test(letters)) return "Enter a recognizable celebrity or character";
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { celebrityName } = await req.json();
    
    if (!celebrityName || typeof celebrityName !== 'string') {
      throw new Error('Celebrity name is required');
    }

    const sanitizedCelebrityName = celebrityName.trim().replace(/\s+/g, " ");
    const inputError = getCelebrityNameError(sanitizedCelebrityName);
    if (inputError) {
      return new Response(JSON.stringify({ error: inputError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Format questions for the AI
    const questionsText = questions.map((q, idx) => {
      const optionsText = q.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt.text}`).join('\n');
      return `Q${idx + 1}. ${q.question}\n${optionsText}`;
    }).join('\n\n');

    const systemPrompt = `You are a world-class personality psychologist who deeply understands human behavior. Your task is to fully embody a celebrity or fictional character and take a personality assessment AS THAT PERSON.

CRITICAL INSTRUCTIONS:
1. BECOME the character mentally. Think about their specific behaviors, famous decisions, documented personality quirks, and how they've reacted in various situations.
2. Answer EACH question INDEPENDENTLY. Do not pick the same answer pattern. Real personalities are MULTI-FACETED.
3. Consider context for EACH question - how would this specific person react in THIS specific scenario?

PERSONALITY FRAMEWORK (The four answer types represent these personalities):
- YELLOW (Fast Executor): Action-oriented, decisive, results-driven, impatient, competitive. Examples: Elon Musk, Gordon Ramsay, Serena Williams
- RED (Creative Motivator): Charismatic, innovative, enthusiastic, visionary, inspires others. Examples: Oprah Winfrey, Richard Branson, Tony Stark (Iron Man)  
- GREEN (Logical Systems Thinker): Analytical, methodical, systematic, detail-oriented, strategic. Examples: Bill Gates, Sherlock Holmes, Warren Buffett
- BLUE (Empathetic Connector): Empathetic, supportive, collaborative, intuitive, relationship-focused. Examples: Princess Diana, Mr. Rogers, Keanu Reeves

CRITICAL REQUIREMENT: Every person is a BLEND of AT LEAST 3 of these types! No one is purely one color. You MUST distribute your answers across at least 3 different colors.
- A character like Tony Stark is primarily Red (creative/visionary), but ALSO shows Yellow traits (action-oriented decisions), Green traits (engineering genius), and even some Blue (loyalty to team).
- Your 50 answers MUST include selections from at least 3 different colors. If you find yourself picking the same letter repeatedly, STOP and reconsider - real people are complex!

Think deeply about:
- Specific scenes, interviews, or moments that reveal their personality
- How they lead and interact with others
- Their decision-making style under pressure
- What motivates them (results? creativity? logic? relationships?)
- Their weaknesses and growth areas

Return ONLY a JSON array of exactly 50 letters. Each answer should thoughtfully reflect how this person would genuinely respond to that specific question.`;

    const userPrompt = `First verify "${sanitizedCelebrityName}" is a real, recognizable celebrity, public figure, or fictional character. If it is gibberish, generic, or unknown, return exactly {"error":"unknown_character"}.

You ARE now "${sanitizedCelebrityName}". Fully embody this person's mindset, values, and behavioral patterns.

Read each question carefully and answer as ${sanitizedCelebrityName} would genuinely answer, based on their known personality, famous behaviors, and documented characteristics.

${questionsText}

Think through each question individually. Consider: "What would ${sanitizedCelebrityName} actually do/think in this situation based on what I know about them?"

REMEMBER: Your answers MUST include at least 3 different letters (representing 3+ colors). No real person answers identically to all scenarios!

Return ONLY a JSON array of exactly 50 letters (A, B, C, or D). Example format: ["A", "C", "B", "D", "A", ...]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const answersText = aiResponse.choices[0].message.content.trim();
    
    // Parse the answers
    let answers: string[];
    try {
      const parsed = JSON.parse(answersText);
      if (parsed?.error === "unknown_character") {
        return new Response(JSON.stringify({ error: "Enter a recognizable celebrity or fictional character" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      answers = parsed;
    } catch {
      // Try to extract letters if JSON parsing fails
      const letterMatches = answersText.match(/[ABCD]/g);
      if (letterMatches && letterMatches.length >= 50) {
        answers = letterMatches.slice(0, 50);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Calculate scores
    const colorCounts = { yellow: 0, red: 0, green: 0, blue: 0 };
    const answerDetails: { questionId: number; section: string; answer: string; color: string }[] = [];
    
    answers.forEach((answer, idx) => {
      if (idx < questions.length) {
        const question = questions[idx];
        const optionIndex = answer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        if (optionIndex >= 0 && optionIndex < 4) {
          const selectedOption = question.options[optionIndex];
          colorCounts[selectedOption.color as keyof typeof colorCounts]++;
          answerDetails.push({
            questionId: question.id,
            section: question.section,
            answer: selectedOption.text,
            color: selectedOption.color
          });
        }
      }
    });

    // Determine primary and secondary colors
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    const dominantColor = sortedColors[0][0] as keyof typeof colorData;
    const secondaryColor = sortedColors[1][0] as keyof typeof colorData;

    const result = {
      celebrityName: sanitizedCelebrityName,
      dominantColor,
      secondaryColor,
      scores: colorCounts,
      totalQuestions: 50,
      profile: {
        dominant: colorData[dominantColor],
        secondary: colorData[secondaryColor],
      },
      answerDetails,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in celebrity-assessment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
