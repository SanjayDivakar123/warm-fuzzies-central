export interface QuestionOption {
  text: string;
  color: "yellow" | "red" | "green" | "blue";
}

export interface Question {
  id: number;
  stage: string;
  question: string;
  options: QuestionOption[];
}

export type AudienceType = "student" | "teacher" | "professional" | "entrepreneur" | "executive" | "manager" | "coach";

export const questionSets: Record<AudienceType, Question[]> = {
  student: [
    // Section A: Leadership & Initiative (Q1–Q5)
    { id: 1, stage: "Leadership", question: "When starting a group project, I usually…", options: [
      { text: "Jump in and assign roles", color: "yellow" },
      { text: "Share a vision or inspiring idea", color: "red" },
      { text: "Plan the process step by step", color: "green" },
      { text: "Suggest new, creative approaches", color: "blue" },
    ]},
    { id: 2, stage: "Leadership", question: "I feel best when I…", options: [
      { text: "See fast results", color: "yellow" },
      { text: "Inspire others to take part", color: "red" },
      { text: "Solve problems with logic", color: "green" },
      { text: "Come up with unique ideas", color: "blue" },
    ]},
    { id: 3, stage: "Leadership", question: "If no one leads, I…", options: [
      { text: "Take control immediately", color: "yellow" },
      { text: "Motivate someone else to step up", color: "red" },
      { text: "Create structure for the group", color: "green" },
      { text: "Pitch a new direction to get moving", color: "blue" },
    ]},
    { id: 4, stage: "Leadership", question: "In stressful situations, I…", options: [
      { text: "Push forward with action", color: "yellow" },
      { text: "Keep others positive", color: "red" },
      { text: "Slow down to analyze carefully", color: "green" },
      { text: "Reframe with a fresh idea", color: "blue" },
    ]},
    { id: 5, stage: "Leadership", question: "The best leaders…", options: [
      { text: "Drive execution and results", color: "yellow" },
      { text: "Inspire and energize people", color: "red" },
      { text: "Think logically and provide clarity", color: "green" },
      { text: "Envision and innovate for the future", color: "blue" },
    ]},
    
    // Section B: Collaboration & Communication (Q6–Q10)
    { id: 6, stage: "Collaboration", question: "In group discussions, I…", options: [
      { text: "Push for a decision", color: "yellow" },
      { text: "Make sure everyone feels heard", color: "red" },
      { text: "Clarify details and structure", color: "green" },
      { text: "Ask creative, 'what if' questions", color: "blue" },
    ]},
    { id: 7, stage: "Collaboration", question: "People count on me to…", options: [
      { text: "Get things done under pressure", color: "yellow" },
      { text: "Bring energy and enthusiasm", color: "red" },
      { text: "Keep things organized and clear", color: "green" },
      { text: "Spot new opportunities", color: "blue" },
    ]},
    { id: 8, stage: "Collaboration", question: "My style of communication is…", options: [
      { text: "Direct and action-oriented", color: "yellow" },
      { text: "Inspiring and expressive", color: "red" },
      { text: "Clear and logical", color: "green" },
      { text: "Creative and forward-looking", color: "blue" },
    ]},
    { id: 9, stage: "Collaboration", question: "I usually motivate others by…", options: [
      { text: "Showing progress and results", color: "yellow" },
      { text: "Sharing vision and passion", color: "red" },
      { text: "Explaining with facts and logic", color: "green" },
      { text: "Introducing bold, new ideas", color: "blue" },
    ]},
    { id: 10, stage: "Collaboration", question: "In a group project, my role is often…", options: [
      { text: "The driver", color: "yellow" },
      { text: "The motivator", color: "red" },
      { text: "The organizer", color: "green" },
      { text: "The idea generator", color: "blue" },
    ]},
    
    // Section C: Problem-Solving & Decision-Making (Q11–Q15)
    { id: 11, stage: "Problem-Solving", question: "When faced with a tough decision, I…", options: [
      { text: "Act quickly", color: "yellow" },
      { text: "Think about how it affects others", color: "red" },
      { text: "Analyze logically", color: "green" },
      { text: "Brainstorm alternatives", color: "blue" },
    ]},
    { id: 12, stage: "Problem-Solving", question: "My strength in solving problems is…", options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Energy and optimism", color: "red" },
      { text: "Logic and analysis", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ]},
    { id: 13, stage: "Problem-Solving", question: "I prefer instructions that are…", options: [
      { text: "Short and actionable", color: "yellow" },
      { text: "Inspiring and motivating", color: "red" },
      { text: "Detailed and structured", color: "green" },
      { text: "Open-ended and flexible", color: "blue" },
    ]},
    { id: 14, stage: "Problem-Solving", question: "In a debate, I…", options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Persuade with passion", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Share new perspectives", color: "blue" },
    ]},
    { id: 15, stage: "Problem-Solving", question: "If my solution doesn't work, I…", options: [
      { text: "Try something else immediately", color: "yellow" },
      { text: "Encourage others not to give up", color: "red" },
      { text: "Reanalyze step by step", color: "green" },
      { text: "Redesign it in a new way", color: "blue" },
    ]},
    
    // Section D: Adaptability & Creativity (Q16–Q20)
    { id: 16, stage: "Adaptability", question: "I handle sudden changes by…", options: [
      { text: "Acting fast to adjust", color: "yellow" },
      { text: "Motivating others to stay positive", color: "red" },
      { text: "Re-planning logically", color: "green" },
      { text: "Rethinking creatively", color: "blue" },
    ]},
    { id: 17, stage: "Adaptability", question: "I learn best when…", options: [
      { text: "I can apply it right away", color: "yellow" },
      { text: "It connects to inspiration or people", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It allows me to explore freely", color: "blue" },
    ]},
    { id: 18, stage: "Adaptability", question: "Free time is best spent…", options: [
      { text: "Building something useful", color: "yellow" },
      { text: "Sharing ideas and connecting", color: "red" },
      { text: "Researching or analyzing", color: "green" },
      { text: "Experimenting with creativity", color: "blue" },
    ]},
    { id: 19, stage: "Adaptability", question: "I stay motivated when…", options: [
      { text: "Progress is visible", color: "yellow" },
      { text: "Energy is high around me", color: "red" },
      { text: "The work is structured", color: "green" },
      { text: "I can innovate", color: "blue" },
    ]},
    { id: 20, stage: "Adaptability", question: "I thrive when I can…", options: [
      { text: "Take decisive action", color: "yellow" },
      { text: "Share vision and passion", color: "red" },
      { text: "Solve problems logically", color: "green" },
      { text: "Create and innovate freely", color: "blue" },
    ]},
    
    // Section E: Self-Awareness & Reflection (Q21–Q25)
    { id: 21, stage: "Self-Awareness", question: "My biggest strength is…", options: [
      { text: "Taking action", color: "yellow" },
      { text: "Motivating others", color: "red" },
      { text: "Thinking logically", color: "green" },
      { text: "Being creative", color: "blue" },
    ]},
    { id: 22, stage: "Self-Awareness", question: "I get frustrated when…", options: [
      { text: "Things move too slowly", color: "yellow" },
      { text: "People lack enthusiasm", color: "red" },
      { text: "Work is disorganized", color: "green" },
      { text: "Ideas are shut down", color: "blue" },
    ]},
    { id: 23, stage: "Self-Awareness", question: "I measure growth by…", options: [
      { text: "What I've accomplished", color: "yellow" },
      { text: "How I've inspired others", color: "red" },
      { text: "What I've learned", color: "green" },
      { text: "What I've created", color: "blue" },
    ]},
    { id: 24, stage: "Self-Awareness", question: "People usually notice that I…", options: [
      { text: "Act quickly", color: "yellow" },
      { text: "Energize others", color: "red" },
      { text: "Think carefully", color: "green" },
      { text: "Offer creative ideas", color: "blue" },
    ]},
    { id: 25, stage: "Self-Awareness", question: "Ultimately, I want to be known as…", options: [
      { text: "A doer who achieves results", color: "yellow" },
      { text: "A motivator who uplifts others", color: "red" },
      { text: "A thinker who solves problems", color: "green" },
      { text: "A creator who innovates", color: "blue" },
    ]},
  ],
  
  teacher: [
    // Section A: Teaching & Classroom Leadership (Q1–Q5)
    { id: 1, stage: "Teaching", question: "When starting a new lesson, I usually…", options: [
      { text: "Jump into teaching right away with clear tasks", color: "yellow" },
      { text: "Connect it to a bigger idea or story to inspire students", color: "red" },
      { text: "Lay out the structure and steps carefully", color: "green" },
      { text: "Design a creative or hands-on activity to launch it", color: "blue" },
    ]},
    { id: 2, stage: "Teaching", question: "My classroom works best when…", options: [
      { text: "Clear routines keep things moving", color: "yellow" },
      { text: "Students feel motivated and energized", color: "red" },
      { text: "Content is organized logically", color: "green" },
      { text: "Curiosity and creativity are encouraged", color: "blue" },
    ]},
    { id: 3, stage: "Teaching", question: "When students are distracted, I…", options: [
      { text: "Redirect quickly to keep things on track", color: "yellow" },
      { text: "Re-engage with encouragement and energy", color: "red" },
      { text: "Reset expectations clearly", color: "green" },
      { text: "Change the activity to something fresh", color: "blue" },
    ]},
    { id: 4, stage: "Teaching", question: "I feel proud as a teacher when…", options: [
      { text: "My students achieve results", color: "yellow" },
      { text: "My students feel inspired", color: "red" },
      { text: "My students master a concept step by step", color: "green" },
      { text: "My students discover something new", color: "blue" },
    ]},
    { id: 5, stage: "Teaching", question: "Students usually see me as…", options: [
      { text: "The one who gets things done", color: "yellow" },
      { text: "The one who inspires them", color: "red" },
      { text: "The one who keeps class organized", color: "green" },
      { text: "The one who makes learning fun and creative", color: "blue" },
    ]},
    
    // Section B: Collaboration & School Culture (Q6–Q10)
    { id: 6, stage: "Collaboration", question: "In staff meetings, I usually…", options: [
      { text: "Push toward action and decisions", color: "yellow" },
      { text: "Encourage and motivate the team", color: "red" },
      { text: "Clarify details and structure", color: "green" },
      { text: "Suggest new approaches", color: "blue" },
    ]},
    { id: 7, stage: "Collaboration", question: "Colleagues rely on me to…", options: [
      { text: "Get projects done", color: "yellow" },
      { text: "Boost morale and energy", color: "red" },
      { text: "Keep things organized", color: "green" },
      { text: "Bring fresh ideas", color: "blue" },
    ]},
    { id: 8, stage: "Collaboration", question: "My communication style is…", options: [
      { text: "Direct and action-focused", color: "yellow" },
      { text: "Expressive and inspiring", color: "red" },
      { text: "Clear and logical", color: "green" },
      { text: "Creative and visionary", color: "blue" },
    ]},
    { id: 9, stage: "Collaboration", question: "I get frustrated when…", options: [
      { text: "Things move too slowly", color: "yellow" },
      { text: "People seem unmotivated", color: "red" },
      { text: "Plans are unclear or sloppy", color: "green" },
      { text: "Innovation is blocked", color: "blue" },
    ]},
    { id: 10, stage: "Collaboration", question: "I contribute to school culture most by…", options: [
      { text: "Driving results and follow-through", color: "yellow" },
      { text: "Building positive energy in the community", color: "red" },
      { text: "Maintaining order and systems", color: "green" },
      { text: "Encouraging creativity and change", color: "blue" },
    ]},
    
    // Section C: Problem-Solving & Decision-Making (Q11–Q15)
    { id: 11, stage: "Problem-Solving", question: "When classroom problems arise, I…", options: [
      { text: "Act quickly to resolve them", color: "yellow" },
      { text: "Encourage students with positivity", color: "red" },
      { text: "Break down the issue logically", color: "green" },
      { text: "Reframe the problem creatively", color: "blue" },
    ]},
    { id: 12, stage: "Problem-Solving", question: "I trust my decisions most when…", options: [
      { text: "They lead to fast results", color: "yellow" },
      { text: "They inspire others", color: "red" },
      { text: "They are backed by data or logic", color: "green" },
      { text: "They create innovative outcomes", color: "blue" },
    ]},
    { id: 13, stage: "Problem-Solving", question: "My problem-solving strength is…", options: [
      { text: "Determination and speed", color: "yellow" },
      { text: "Motivation and enthusiasm", color: "red" },
      { text: "Careful analysis", color: "green" },
      { text: "Out-of-the-box thinking", color: "blue" },
    ]},
    { id: 14, stage: "Problem-Solving", question: "In debates, I…", options: [
      { text: "Push toward resolution quickly", color: "yellow" },
      { text: "Persuade with passion and stories", color: "red" },
      { text: "Use facts and logical reasoning", color: "green" },
      { text: "Share new perspectives and ideas", color: "blue" },
    ]},
    { id: 15, stage: "Problem-Solving", question: "If my first plan doesn't work, I…", options: [
      { text: "Try another approach right away", color: "yellow" },
      { text: "Keep others motivated to continue", color: "red" },
      { text: "Reanalyze step by step", color: "green" },
      { text: "Redesign with a creative twist", color: "blue" },
    ]},
    
    // Section D: Adaptability & Innovation (Q16–Q20)
    { id: 16, stage: "Adaptability", question: "When curriculum changes happen, I…", options: [
      { text: "Adjust quickly and keep moving", color: "yellow" },
      { text: "Stay positive and help others adapt", color: "red" },
      { text: "Rework plans logically", color: "green" },
      { text: "Try out creative alternatives", color: "blue" },
    ]},
    { id: 17, stage: "Adaptability", question: "I learn best when…", options: [
      { text: "I can apply it right away", color: "yellow" },
      { text: "It connects to inspiring ideas", color: "red" },
      { text: "It's structured step by step", color: "green" },
      { text: "It's open for experimentation", color: "blue" },
    ]},
    { id: 18, stage: "Adaptability", question: "I'm most energized when…", options: [
      { text: "Things are moving into action", color: "yellow" },
      { text: "People around me are motivated", color: "red" },
      { text: "Work is structured and clear", color: "green" },
      { text: "There's room for creativity", color: "blue" },
    ]},
    { id: 19, stage: "Adaptability", question: "If my plan is interrupted, I…", options: [
      { text: "Act quickly with a backup", color: "yellow" },
      { text: "Keep others encouraged", color: "red" },
      { text: "Re-plan step by step", color: "green" },
      { text: "Pivot to a new creative idea", color: "blue" },
    ]},
    { id: 20, stage: "Adaptability", question: "The teaching projects I enjoy most are…", options: [
      { text: "Fast-paced and goal-oriented", color: "yellow" },
      { text: "Energizing and people-focused", color: "red" },
      { text: "Structured and methodical", color: "green" },
      { text: "Open-ended and innovative", color: "blue" },
    ]},
    
    // Section E: Self-Awareness & Reflection (Q21–Q25)
    { id: 21, stage: "Self-Awareness", question: "My biggest teaching strength is…", options: [
      { text: "Taking action and execution", color: "yellow" },
      { text: "Inspiring and motivating students", color: "red" },
      { text: "Organizing and structuring content", color: "green" },
      { text: "Creating engaging, innovative lessons", color: "blue" },
    ]},
    { id: 22, stage: "Self-Awareness", question: "I measure my growth by…", options: [
      { text: "What I've accomplished with students", color: "yellow" },
      { text: "How many I've inspired", color: "red" },
      { text: "What I've structured and clarified", color: "green" },
      { text: "What I've created or innovated", color: "blue" },
    ]},
    { id: 23, stage: "Self-Awareness", question: "The hardest thing for me is…", options: [
      { text: "Waiting without acting", color: "yellow" },
      { text: "Working without inspiration", color: "red" },
      { text: "Operating without structure", color: "green" },
      { text: "Following rigid rules", color: "blue" },
    ]},
    { id: 24, stage: "Self-Awareness", question: "My colleagues usually notice that I…", options: [
      { text: "Move things into action", color: "yellow" },
      { text: "Motivate and energize others", color: "red" },
      { text: "Keep things organized", color: "green" },
      { text: "Share creative ideas", color: "blue" },
    ]},
    { id: 25, stage: "Self-Awareness", question: "Ultimately, I want to be known as…", options: [
      { text: "A teacher who gets results", color: "yellow" },
      { text: "A teacher who inspires others", color: "red" },
      { text: "A teacher who brings structure and clarity", color: "green" },
      { text: "A teacher who sparks creativity", color: "blue" },
    ]},
  ],
  
  professional: [
    // Section A: Leadership & Initiative (Q1–Q5)
    { id: 1, stage: "Leadership", question: "When starting a new project, I usually…", options: [
      { text: "Take immediate action and assign tasks", color: "yellow" },
      { text: "Share the bigger vision and energize the team", color: "red" },
      { text: "Build a structured plan step by step", color: "green" },
      { text: "Brainstorm new and creative approaches", color: "blue" },
    ]},
    { id: 2, stage: "Leadership", question: "The best leaders…", options: [
      { text: "Drive execution and results", color: "yellow" },
      { text: "Inspire with passion and communication", color: "red" },
      { text: "Provide logic and clarity", color: "green" },
      { text: "Innovate and reimagine possibilities", color: "blue" },
    ]},
    { id: 3, stage: "Leadership", question: "When deadlines approach, I…", options: [
      { text: "Push the team into focused action", color: "yellow" },
      { text: "Rally people with encouragement and energy", color: "red" },
      { text: "Reorganize priorities logically", color: "green" },
      { text: "Find creative shortcuts to achieve goals", color: "blue" },
    ]},
    { id: 4, stage: "Leadership", question: "My colleagues usually describe me as…", options: [
      { text: "The one who makes things happen", color: "yellow" },
      { text: "The one who motivates and uplifts", color: "red" },
      { text: "The one who keeps things organized", color: "green" },
      { text: "The one who brings innovative ideas", color: "blue" },
    ]},
    { id: 5, stage: "Leadership", question: "I feel most accomplished when…", options: [
      { text: "Results are achieved quickly", color: "yellow" },
      { text: "People are inspired by my work", color: "red" },
      { text: "Systems are clear and efficient", color: "green" },
      { text: "Something new and original is created", color: "blue" },
    ]},
    
    // Section B: Collaboration & Communication (Q6–Q10)
    { id: 6, stage: "Collaboration", question: "In team discussions, I tend to…", options: [
      { text: "Push toward decisions and action", color: "yellow" },
      { text: "Motivate and energize others", color: "red" },
      { text: "Clarify details and structure", color: "green" },
      { text: "Ask bold, creative 'what if' questions", color: "blue" },
    ]},
    { id: 7, stage: "Collaboration", question: "My teammates rely on me for…", options: [
      { text: "Speed and reliability", color: "yellow" },
      { text: "Energy and encouragement", color: "red" },
      { text: "Organization and logic", color: "green" },
      { text: "Creative problem-solving", color: "blue" },
    ]},
    { id: 8, stage: "Collaboration", question: "My communication style is…", options: [
      { text: "Direct and action-oriented", color: "yellow" },
      { text: "Enthusiastic and persuasive", color: "red" },
      { text: "Clear and precise", color: "green" },
      { text: "Conceptual and visionary", color: "blue" },
    ]},
    { id: 9, stage: "Collaboration", question: "I get frustrated when…", options: [
      { text: "Projects stall without action", color: "yellow" },
      { text: "People lack passion or motivation", color: "red" },
      { text: "Details are overlooked", color: "green" },
      { text: "Innovation is resisted", color: "blue" },
    ]},
    { id: 10, stage: "Collaboration", question: "My role in teams is usually…", options: [
      { text: "The driver who executes", color: "yellow" },
      { text: "The motivator who inspires", color: "red" },
      { text: "The organizer who structures", color: "green" },
      { text: "The innovator who creates", color: "blue" },
    ]},
    
    // Section C: Problem-Solving & Decision-Making (Q11–Q15)
    { id: 11, stage: "Problem-Solving", question: "When solving problems, my first step is to…", options: [
      { text: "Act quickly and test a solution", color: "yellow" },
      { text: "Motivate others to stay positive", color: "red" },
      { text: "Break it down into logical steps", color: "green" },
      { text: "Reframe the issue creatively", color: "blue" },
    ]},
    { id: 12, stage: "Problem-Solving", question: "I trust decisions when…", options: [
      { text: "They produce fast results", color: "yellow" },
      { text: "They inspire and energize others", color: "red" },
      { text: "They are backed by logic and data", color: "green" },
      { text: "They open new opportunities", color: "blue" },
    ]},
    { id: 13, stage: "Problem-Solving", question: "My problem-solving strength is…", options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Motivation and optimism", color: "red" },
      { text: "Structure and clarity", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ]},
    { id: 14, stage: "Problem-Solving", question: "In debates, I…", options: [
      { text: "Push for a resolution quickly", color: "yellow" },
      { text: "Persuade with passion and stories", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Share new perspectives and ideas", color: "blue" },
    ]},
    { id: 15, stage: "Problem-Solving", question: "If my plan fails, I…", options: [
      { text: "Try another approach immediately", color: "yellow" },
      { text: "Encourage others not to give up", color: "red" },
      { text: "Reanalyze carefully step by step", color: "green" },
      { text: "Redesign it with creativity", color: "blue" },
    ]},
    
    // Section D: Adaptability & Innovation (Q16–Q20)
    { id: 16, stage: "Adaptability", question: "When unexpected changes happen, I…", options: [
      { text: "Adjust quickly and keep moving", color: "yellow" },
      { text: "Stay positive and encourage others", color: "red" },
      { text: "Re-plan logically", color: "green" },
      { text: "Pivot to a creative alternative", color: "blue" },
    ]},
    { id: 17, stage: "Adaptability", question: "I learn best when…", options: [
      { text: "I can apply it immediately", color: "yellow" },
      { text: "It connects to purpose and people", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It allows me to experiment", color: "blue" },
    ]},
    { id: 18, stage: "Adaptability", question: "I'm most energized when…", options: [
      { text: "Projects are moving fast", color: "yellow" },
      { text: "People are motivated and connected", color: "red" },
      { text: "Work is organized and structured", color: "green" },
      { text: "There's space to innovate", color: "blue" },
    ]},
    { id: 19, stage: "Adaptability", question: "The workplace projects I enjoy most are…", options: [
      { text: "Goal-driven and fast-paced", color: "yellow" },
      { text: "Energizing and people-centered", color: "red" },
      { text: "Structured and methodical", color: "green" },
      { text: "Open-ended and innovative", color: "blue" },
    ]},
    { id: 20, stage: "Adaptability", question: "If plans are interrupted, I…", options: [
      { text: "Act quickly with a backup", color: "yellow" },
      { text: "Keep others motivated", color: "red" },
      { text: "Re-plan step by step", color: "green" },
      { text: "Pivot to a fresh idea", color: "blue" },
    ]},
    
    // Section E: Self-Awareness & Reflection (Q21–Q25)
    { id: 21, stage: "Self-Awareness", question: "My biggest professional strength is…", options: [
      { text: "Getting things done", color: "yellow" },
      { text: "Inspiring others", color: "red" },
      { text: "Thinking logically", color: "green" },
      { text: "Creating new ideas", color: "blue" },
    ]},
    { id: 22, stage: "Self-Awareness", question: "I measure success by…", options: [
      { text: "The results achieved", color: "yellow" },
      { text: "The people inspired", color: "red" },
      { text: "The systems improved", color: "green" },
      { text: "The innovations created", color: "blue" },
    ]},
    { id: 23, stage: "Self-Awareness", question: "I get frustrated when…", options: [
      { text: "Action is delayed", color: "yellow" },
      { text: "Passion is missing", color: "red" },
      { text: "Plans lack structure", color: "green" },
      { text: "Creativity is blocked", color: "blue" },
    ]},
    { id: 24, stage: "Self-Awareness", question: "My colleagues usually notice that I…", options: [
      { text: "Drive things into action", color: "yellow" },
      { text: "Motivate with enthusiasm", color: "red" },
      { text: "Keep things organized", color: "green" },
      { text: "Offer creative ideas", color: "blue" },
    ]},
    { id: 25, stage: "Self-Awareness", question: "Ultimately, I want to be known as…", options: [
      { text: "A doer who delivers results", color: "yellow" },
      { text: "A motivator who inspires others", color: "red" },
      { text: "A thinker who brings order", color: "green" },
      { text: "A creator who innovates", color: "blue" },
    ]},
  ],
  
  entrepreneur: [
    // Section A: Vision & Leadership (Q1–Q5)
    { id: 1, stage: "Vision", question: "When launching a new venture, I usually…", options: [
      { text: "Start building right away", color: "yellow" },
      { text: "Share the story to inspire others", color: "red" },
      { text: "Develop a structured business model", color: "green" },
      { text: "Design an innovative solution", color: "blue" },
    ]},
    { id: 2, stage: "Vision", question: "As a leader, I'm most focused on…", options: [
      { text: "Fast execution and results", color: "yellow" },
      { text: "Inspiring my team and investors", color: "red" },
      { text: "Building scalable systems", color: "green" },
      { text: "Creating something disruptive", color: "blue" },
    ]},
    { id: 3, stage: "Vision", question: "In investor pitches, I emphasize…", options: [
      { text: "Traction and execution speed", color: "yellow" },
      { text: "Mission and vision", color: "red" },
      { text: "Numbers and logical projections", color: "green" },
      { text: "Innovation and uniqueness", color: "blue" },
    ]},
    { id: 4, stage: "Vision", question: "My biggest strength as a founder is…", options: [
      { text: "Acting decisively and getting things done", color: "yellow" },
      { text: "Rallying people around the mission", color: "red" },
      { text: "Structuring and analyzing carefully", color: "green" },
      { text: "Innovating beyond the status quo", color: "blue" },
    ]},
    { id: 5, stage: "Vision", question: "Co-founders usually describe me as…", options: [
      { text: "The executor who drives action", color: "yellow" },
      { text: "The motivator who brings energy", color: "red" },
      { text: "The strategist who organizes", color: "green" },
      { text: "The visionary who invents new ideas", color: "blue" },
    ]},
    
    // Section B: Team-Building & Collaboration (Q6–Q10)
    { id: 6, stage: "Team-Building", question: "In team meetings, I tend to…", options: [
      { text: "Push toward decisions and action", color: "yellow" },
      { text: "Inspire and energize others", color: "red" },
      { text: "Clarify details and structure plans", color: "green" },
      { text: "Spark creative brainstorming", color: "blue" },
    ]},
    { id: 7, stage: "Team-Building", question: "My teammates rely on me for…", options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Energy and vision", color: "red" },
      { text: "Organization and structure", color: "green" },
      { text: "New ideas and creativity", color: "blue" },
    ]},
    { id: 8, stage: "Team-Building", question: "My communication style is…", options: [
      { text: "Direct and efficient", color: "yellow" },
      { text: "Story-driven and inspiring", color: "red" },
      { text: "Clear and data-focused", color: "green" },
      { text: "Conceptual and visionary", color: "blue" },
    ]},
    { id: 9, stage: "Team-Building", question: "I get frustrated when…", options: [
      { text: "Things move too slowly", color: "yellow" },
      { text: "People lack energy", color: "red" },
      { text: "Plans are messy or illogical", color: "green" },
      { text: "Innovation is blocked", color: "blue" },
    ]},
    { id: 10, stage: "Team-Building", question: "The culture I want to build is…", options: [
      { text: "Execution-focused", color: "yellow" },
      { text: "Passionate and mission-driven", color: "red" },
      { text: "Structured and reliable", color: "green" },
      { text: "Innovative and experimental", color: "blue" },
    ]},
    
    // Section C: Problem-Solving & Decision-Making (Q11–Q15)
    { id: 11, stage: "Problem-Solving", question: "When faced with a big challenge, I…", options: [
      { text: "Act quickly to test solutions", color: "yellow" },
      { text: "Motivate others to stay positive", color: "red" },
      { text: "Break it down logically", color: "green" },
      { text: "Reframe the problem creatively", color: "blue" },
    ]},
    { id: 12, stage: "Problem-Solving", question: "I trust my decisions most when…", options: [
      { text: "They deliver immediate results", color: "yellow" },
      { text: "They inspire people", color: "red" },
      { text: "They are backed by data and logic", color: "green" },
      { text: "They create new opportunities", color: "blue" },
    ]},
    { id: 13, stage: "Problem-Solving", question: "My strength in problem-solving is…", options: [
      { text: "Speed and resilience", color: "yellow" },
      { text: "Motivation and persuasion", color: "red" },
      { text: "Analysis and structure", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ]},
    { id: 14, stage: "Problem-Solving", question: "In tough debates, I…", options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Persuade with energy and vision", color: "red" },
      { text: "Use facts and reasoning", color: "green" },
      { text: "Offer fresh perspectives", color: "blue" },
    ]},
    { id: 15, stage: "Problem-Solving", question: "If my plan fails, I…", options: [
      { text: "Try another route immediately", color: "yellow" },
      { text: "Keep the team encouraged", color: "red" },
      { text: "Reanalyze step by step", color: "green" },
      { text: "Pivot to a bold new idea", color: "blue" },
    ]},
    
    // Section D: Adaptability & Innovation (Q16–Q20)
    { id: 16, stage: "Adaptability", question: "When the market shifts, I…", options: [
      { text: "Adjust quickly and execute fast", color: "yellow" },
      { text: "Keep stakeholders inspired", color: "red" },
      { text: "Rework the strategy logically", color: "green" },
      { text: "Innovate with new offerings", color: "blue" },
    ]},
    { id: 17, stage: "Adaptability", question: "I learn best when…", options: [
      { text: "I can apply it right away", color: "yellow" },
      { text: "It connects to mission and people", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It's experimental and creative", color: "blue" },
    ]},
    { id: 18, stage: "Adaptability", question: "I'm most energized when…", options: [
      { text: "Things are moving quickly", color: "yellow" },
      { text: "People are passionate and motivated", color: "red" },
      { text: "Work is structured and clear", color: "green" },
      { text: "There's room to innovate", color: "blue" },
    ]},
    { id: 19, stage: "Adaptability", question: "The ventures I enjoy most are…", options: [
      { text: "Fast-paced and growth-driven", color: "yellow" },
      { text: "Purposeful and people-focused", color: "red" },
      { text: "Structured and scalable", color: "green" },
      { text: "Disruptive and innovative", color: "blue" },
    ]},
    { id: 20, stage: "Adaptability", question: "If my startup hits a roadblock, I…", options: [
      { text: "Act fast to try something new", color: "yellow" },
      { text: "Motivate others not to give up", color: "red" },
      { text: "Re-plan carefully and systematically", color: "green" },
      { text: "Pivot creatively into a new direction", color: "blue" },
    ]},
    
    // Section E: Self-Awareness & Reflection (Q21–Q25)
    { id: 21, stage: "Self-Awareness", question: "My biggest entrepreneurial strength is…", options: [
      { text: "Taking action and execution", color: "yellow" },
      { text: "Inspiring others", color: "red" },
      { text: "Logical thinking", color: "green" },
      { text: "Creative vision", color: "blue" },
    ]},
    { id: 22, stage: "Self-Awareness", question: "I measure success by…", options: [
      { text: "Speed of growth and traction", color: "yellow" },
      { text: "The people I've inspired", color: "red" },
      { text: "The systems I've built", color: "green" },
      { text: "The innovations I've created", color: "blue" },
    ]},
    { id: 23, stage: "Self-Awareness", question: "I get frustrated when…", options: [
      { text: "Action slows down", color: "yellow" },
      { text: "People lack passion", color: "red" },
      { text: "Work is disorganized", color: "green" },
      { text: "Ideas are shut down", color: "blue" },
    ]},
    { id: 24, stage: "Self-Awareness", question: "My colleagues/investors usually notice that I…", options: [
      { text: "Push things forward fast", color: "yellow" },
      { text: "Inspire and energize people", color: "red" },
      { text: "Present logic and structure clearly", color: "green" },
      { text: "Offer bold, creative ideas", color: "blue" },
    ]},
    { id: 25, stage: "Self-Awareness", question: "Ultimately, I want to be known as…", options: [
      { text: "A founder who executes and scales", color: "yellow" },
      { text: "A founder who inspires movements", color: "red" },
      { text: "A founder who builds systems that last", color: "green" },
      { text: "A founder who disrupts with innovation", color: "blue" },
    ]},
  ],

  executive: [
    // Section A: Vision & Strategy (Q1–Q5)
    { id: 1, stage: "Strategy", question: "When setting direction, I usually…", options: [
      { text: "Move into execution quickly", color: "yellow" },
      { text: "Inspire others with an energizing vision", color: "red" },
      { text: "Build structured, strategic plans", color: "green" },
      { text: "Explore innovative approaches to the future", color: "blue" },
    ]},
    { id: 2, stage: "Strategy", question: "A successful executive is defined by…", options: [
      { text: "Delivering results efficiently", color: "yellow" },
      { text: "Inspiring people at every level", color: "red" },
      { text: "Establishing order and accountability", color: "green" },
      { text: "Driving innovation and change", color: "blue" },
    ]},
    { id: 3, stage: "Strategy", question: "When launching initiatives, I…", options: [
      { text: "Push for immediate action", color: "yellow" },
      { text: "Communicate mission and purpose broadly", color: "red" },
      { text: "Define milestones and structure clearly", color: "green" },
      { text: "Encourage experimentation", color: "blue" },
    ]},
    { id: 4, stage: "Strategy", question: "In my organization, I want to be known as…", options: [
      { text: "The one who gets results", color: "yellow" },
      { text: "The one who inspires a shared vision", color: "red" },
      { text: "The one who provides stability and systems", color: "green" },
      { text: "The one who brings breakthrough ideas", color: "blue" },
    ]},
    { id: 5, stage: "Strategy", question: "My biggest strength in leadership is…", options: [
      { text: "Decisive action", color: "yellow" },
      { text: "Motivating people", color: "red" },
      { text: "Strategic clarity", color: "green" },
      { text: "Creative foresight", color: "blue" },
    ]},
    
    // Section B: Collaboration & Culture (Q6–Q10)
    { id: 6, stage: "Culture", question: "In executive meetings, I usually…", options: [
      { text: "Drive decisions and outcomes", color: "yellow" },
      { text: "Energize the room with inspiration", color: "red" },
      { text: "Clarify structure and responsibilities", color: "green" },
      { text: "Suggest forward-looking ideas", color: "blue" },
    ]},
    { id: 7, stage: "Culture", question: "My colleagues rely on me to…", options: [
      { text: "Ensure things move forward fast", color: "yellow" },
      { text: "Keep morale and energy high", color: "red" },
      { text: "Provide order and processes", color: "green" },
      { text: "Bring innovation to the table", color: "blue" },
    ]},
    { id: 8, stage: "Culture", question: "I believe culture is built by…", options: [
      { text: "Executing and achieving goals", color: "yellow" },
      { text: "Inspiring shared values", color: "red" },
      { text: "Defining systems and accountability", color: "green" },
      { text: "Encouraging creativity and experimentation", color: "blue" },
    ]},
    { id: 9, stage: "Culture", question: "When conflict arises among leaders, I…", options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Motivate reconciliation through vision", color: "red" },
      { text: "Analyze logically to find fairness", color: "green" },
      { text: "Reframe with new possibilities", color: "blue" },
    ]},
    { id: 10, stage: "Culture", question: "The culture I strive to create is…", options: [
      { text: "Fast-moving and results-driven", color: "yellow" },
      { text: "Purposeful and inspiring", color: "red" },
      { text: "Structured and reliable", color: "green" },
      { text: "Innovative and future-oriented", color: "blue" },
    ]},
    
    // Section C: Decision-Making & Problem-Solving (Q11–Q15)
    { id: 11, stage: "Decision-Making", question: "When facing a major decision, I first…", options: [
      { text: "Take decisive action quickly", color: "yellow" },
      { text: "Consider the inspirational impact", color: "red" },
      { text: "Break it into logical parts", color: "green" },
      { text: "Explore new approaches", color: "blue" },
    ]},
    { id: 12, stage: "Decision-Making", question: "My decision-making strength is…", options: [
      { text: "Speed and confidence", color: "yellow" },
      { text: "Vision and persuasion", color: "red" },
      { text: "Structure and analysis", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ]},
    { id: 13, stage: "Decision-Making", question: "In crises, I…", options: [
      { text: "Act fast to stabilize", color: "yellow" },
      { text: "Motivate others to stay hopeful", color: "red" },
      { text: "Systematically solve the issue", color: "green" },
      { text: "Redesign the approach innovatively", color: "blue" },
    ]},
    { id: 14, stage: "Decision-Making", question: "I measure success by…", options: [
      { text: "Results achieved", color: "yellow" },
      { text: "People inspired", color: "red" },
      { text: "Systems sustained", color: "green" },
      { text: "Innovations created", color: "blue" },
    ]},
    { id: 15, stage: "Decision-Making", question: "If a decision backfires, I…", options: [
      { text: "Pivot into action immediately", color: "yellow" },
      { text: "Keep morale strong", color: "red" },
      { text: "Reassess systematically", color: "green" },
      { text: "Reframe and pivot creatively", color: "blue" },
    ]},
    
    // Section D: Adaptability & Innovation (Q16–Q20)
    { id: 16, stage: "Innovation", question: "When markets or policies shift, I…", options: [
      { text: "Act quickly to adapt strategy", color: "yellow" },
      { text: "Rally people to stay confident", color: "red" },
      { text: "Adjust systems carefully", color: "green" },
      { text: "Innovate a new pathway", color: "blue" },
    ]},
    { id: 17, stage: "Innovation", question: "I stay energized when…", options: [
      { text: "Projects show quick wins", color: "yellow" },
      { text: "People are inspired around me", color: "red" },
      { text: "Work is structured and clear", color: "green" },
      { text: "Creative ideas flow freely", color: "blue" },
    ]},
    { id: 18, stage: "Innovation", question: "My adaptability comes from…", options: [
      { text: "Decisive action regardless of change", color: "yellow" },
      { text: "Positivity and motivating others", color: "red" },
      { text: "Careful restructuring", color: "green" },
      { text: "Rethinking problems creatively", color: "blue" },
    ]},
    { id: 19, stage: "Innovation", question: "The projects I enjoy most are…", options: [
      { text: "Fast-paced and goal-driven", color: "yellow" },
      { text: "Inspiring and people-centered", color: "red" },
      { text: "Structured and process-oriented", color: "green" },
      { text: "Experimental and innovative", color: "blue" },
    ]},
    { id: 20, stage: "Innovation", question: "In moments of disruption, I…", options: [
      { text: "Push into action immediately", color: "yellow" },
      { text: "Keep the team motivated", color: "red" },
      { text: "Re-plan logically step by step", color: "green" },
      { text: "Find creative alternatives", color: "blue" },
    ]},
    
    // Section E: Self-Awareness & Reflection (Q21–Q25)
    { id: 21, stage: "Reflection", question: "My leadership legacy should be…", options: [
      { text: "Getting things done", color: "yellow" },
      { text: "Inspiring people widely", color: "red" },
      { text: "Building stable systems", color: "green" },
      { text: "Creating innovation", color: "blue" },
    ]},
    { id: 22, stage: "Reflection", question: "I get frustrated when…", options: [
      { text: "Action is delayed", color: "yellow" },
      { text: "Energy is low", color: "red" },
      { text: "Processes are messy", color: "green" },
      { text: "New ideas are dismissed", color: "blue" },
    ]},
    { id: 23, stage: "Reflection", question: "I learn best when…", options: [
      { text: "I can apply knowledge right away", color: "yellow" },
      { text: "It connects to people and vision", color: "red" },
      { text: "It's systematic and logical", color: "green" },
      { text: "It's open to experimentation", color: "blue" },
    ]},
    { id: 24, stage: "Reflection", question: "My colleagues usually notice that I…", options: [
      { text: "Push things into motion", color: "yellow" },
      { text: "Motivate and inspire constantly", color: "red" },
      { text: "Provide clarity and structure", color: "green" },
      { text: "Offer creative, new ideas", color: "blue" },
    ]},
    { id: 25, stage: "Reflection", question: "Ultimately, I want to be remembered as…", options: [
      { text: "A doer who delivered results", color: "yellow" },
      { text: "A motivator who uplifted others", color: "red" },
      { text: "A strategist who built stability", color: "green" },
      { text: "A visionary who sparked innovation", color: "blue" },
    ]},
  ],

  manager: [
    // Section A: Leadership & Initiative (Q1–Q5)
    { id: 1, stage: "Leadership", question: "When my team starts a project, I usually…", options: [
      { text: "Define tasks and move into action quickly", color: "yellow" },
      { text: "Inspire the team with energy and purpose", color: "red" },
      { text: "Build a structured plan with timelines", color: "green" },
      { text: "Brainstorm creative approaches first", color: "blue" },
    ]},
    { id: 2, stage: "Leadership", question: "My biggest strength as a manager is…", options: [
      { text: "Taking decisive action", color: "yellow" },
      { text: "Motivating and supporting people", color: "red" },
      { text: "Organizing processes logically", color: "green" },
      { text: "Designing new ways to improve", color: "blue" },
    ]},
    { id: 3, stage: "Leadership", question: "Deadlines motivate me to…", options: [
      { text: "Push for fast results", color: "yellow" },
      { text: "Rally people to give their best effort", color: "red" },
      { text: "Reorder priorities systematically", color: "green" },
      { text: "Find inventive shortcuts to deliver", color: "blue" },
    ]},
    { id: 4, stage: "Leadership", question: "My team would describe me as…", options: [
      { text: "The one who gets things done", color: "yellow" },
      { text: "The one who inspires and energizes", color: "red" },
      { text: "The one who keeps everything on track", color: "green" },
      { text: "The one who brings creative ideas", color: "blue" },
    ]},
    { id: 5, stage: "Leadership", question: "I feel most accomplished as a leader when…", options: [
      { text: "My team executes efficiently", color: "yellow" },
      { text: "My team feels motivated and united", color: "red" },
      { text: "Systems are working smoothly", color: "green" },
      { text: "We've created something new and valuable", color: "blue" },
    ]},
    
    // Section B: Collaboration & Communication (Q6–Q10)
    { id: 6, stage: "Collaboration", question: "In team meetings, I tend to…", options: [
      { text: "Push for decisions and next steps", color: "yellow" },
      { text: "Motivate people with positivity", color: "red" },
      { text: "Clarify structure and responsibilities", color: "green" },
      { text: "Spark creative thinking", color: "blue" },
    ]},
    { id: 7, stage: "Collaboration", question: "My team relies on me for…", options: [
      { text: "Fast execution", color: "yellow" },
      { text: "Encouragement and energy", color: "red" },
      { text: "Clear organization", color: "green" },
      { text: "Creative solutions", color: "blue" },
    ]},
    { id: 8, stage: "Collaboration", question: "My communication style is…", options: [
      { text: "Direct and action-oriented", color: "yellow" },
      { text: "Expressive and inspiring", color: "red" },
      { text: "Clear and detailed", color: "green" },
      { text: "Conceptual and visionary", color: "blue" },
    ]},
    { id: 9, stage: "Collaboration", question: "I get most frustrated when…", options: [
      { text: "Progress slows down", color: "yellow" },
      { text: "Morale drops", color: "red" },
      { text: "Plans get messy", color: "green" },
      { text: "New ideas are ignored", color: "blue" },
    ]},
    { id: 10, stage: "Collaboration", question: "I contribute to workplace culture by…", options: [
      { text: "Driving execution and results", color: "yellow" },
      { text: "Building team spirit", color: "red" },
      { text: "Keeping systems efficient", color: "green" },
      { text: "Encouraging innovation", color: "blue" },
    ]},
    
    // Section C: Problem-Solving & Decision-Making (Q11–Q15)
    { id: 11, stage: "Problem-Solving", question: "When problems arise, I first…", options: [
      { text: "Act quickly to resolve them", color: "yellow" },
      { text: "Keep the team's morale strong", color: "red" },
      { text: "Break the problem into parts", color: "green" },
      { text: "Reframe with a fresh idea", color: "blue" },
    ]},
    { id: 12, stage: "Problem-Solving", question: "I trust my decisions most when…", options: [
      { text: "They deliver fast results", color: "yellow" },
      { text: "They inspire the team", color: "red" },
      { text: "They're backed by data", color: "green" },
      { text: "They create new opportunities", color: "blue" },
    ]},
    { id: 13, stage: "Problem-Solving", question: "My problem-solving style is…", options: [
      { text: "Determined and fast-moving", color: "yellow" },
      { text: "Motivational and people-focused", color: "red" },
      { text: "Analytical and structured", color: "green" },
      { text: "Creative and imaginative", color: "blue" },
    ]},
    { id: 14, stage: "Problem-Solving", question: "In discussions, I usually…", options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Persuade with energy and vision", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Share new perspectives", color: "blue" },
    ]},
    { id: 15, stage: "Problem-Solving", question: "If my first plan fails, I…", options: [
      { text: "Try something else right away", color: "yellow" },
      { text: "Keep people motivated", color: "red" },
      { text: "Reanalyze carefully", color: "green" },
      { text: "Pivot creatively", color: "blue" },
    ]},
    
    // Section D: Adaptability & Innovation (Q16–Q20)
    { id: 16, stage: "Adaptability", question: "When unexpected changes happen, I…", options: [
      { text: "Adjust quickly and move forward", color: "yellow" },
      { text: "Stay positive and reassure others", color: "red" },
      { text: "Re-plan systematically", color: "green" },
      { text: "Pivot to a creative alternative", color: "blue" },
    ]},
    { id: 17, stage: "Adaptability", question: "I learn best when…", options: [
      { text: "I can apply it immediately", color: "yellow" },
      { text: "It's connected to people and purpose", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It's open to experimentation", color: "blue" },
    ]},
    { id: 18, stage: "Adaptability", question: "I'm most energized when…", options: [
      { text: "Work is moving fast", color: "yellow" },
      { text: "People are engaged and motivated", color: "red" },
      { text: "Systems are running smoothly", color: "green" },
      { text: "Ideas are flowing freely", color: "blue" },
    ]},
    { id: 19, stage: "Adaptability", question: "The projects I enjoy most are…", options: [
      { text: "Fast-paced and practical", color: "yellow" },
      { text: "People-driven and inspiring", color: "red" },
      { text: "Structured and methodical", color: "green" },
      { text: "Innovative and experimental", color: "blue" },
    ]},
    { id: 20, stage: "Adaptability", question: "When plans get disrupted, I…", options: [
      { text: "Push into action quickly", color: "yellow" },
      { text: "Keep morale high", color: "red" },
      { text: "Reassess logically", color: "green" },
      { text: "Reframe with creativity", color: "blue" },
    ]},
    
    // Section E: Self-Awareness & Reflection (Q21–Q25)
    { id: 21, stage: "Self-Awareness", question: "My biggest management strength is…", options: [
      { text: "Execution and action", color: "yellow" },
      { text: "Motivation and inspiration", color: "red" },
      { text: "Organization and logic", color: "green" },
      { text: "Creativity and innovation", color: "blue" },
    ]},
    { id: 22, stage: "Self-Awareness", question: "I measure my growth by…", options: [
      { text: "What I've accomplished", color: "yellow" },
      { text: "Who I've inspired", color: "red" },
      { text: "What I've structured or improved", color: "green" },
      { text: "What I've innovated", color: "blue" },
    ]},
    { id: 23, stage: "Self-Awareness", question: "I get most frustrated when…", options: [
      { text: "Progress slows", color: "yellow" },
      { text: "Energy is missing", color: "red" },
      { text: "Systems are unclear", color: "green" },
      { text: "Creativity is blocked", color: "blue" },
    ]},
    { id: 24, stage: "Self-Awareness", question: "My team usually notices that I…", options: [
      { text: "Push things into action", color: "yellow" },
      { text: "Lift energy and motivation", color: "red" },
      { text: "Keep order and clarity", color: "green" },
      { text: "Offer new ideas", color: "blue" },
    ]},
    { id: 25, stage: "Self-Awareness", question: "Ultimately, I want to be known as…", options: [
      { text: "A manager who gets results", color: "yellow" },
      { text: "A manager who inspires people", color: "red" },
      { text: "A manager who builds structure", color: "green" },
      { text: "A manager who sparks innovation", color: "blue" },
    ]},
  ],

  coach: [
    // Section A: Performance & Leadership (Q1–Q5)
    { id: 1, stage: "Performance", question: "On the field, my instinct is to…", options: [
      { text: "Act immediately and execute the play", color: "yellow" },
      { text: "Fire up my teammates", color: "red" },
      { text: "Stick to the planned strategy", color: "green" },
      { text: "Try a creative move to surprise", color: "blue" },
    ]},
    { id: 2, stage: "Performance", question: "As a leader, I'm strongest when I…", options: [
      { text: "Lead by consistent action", color: "yellow" },
      { text: "Motivate others with passion", color: "red" },
      { text: "Organize and enforce discipline", color: "green" },
      { text: "Create innovative plays or drills", color: "blue" },
    ]},
    { id: 3, stage: "Performance", question: "When a game gets tough, I…", options: [
      { text: "Double down on effort", color: "yellow" },
      { text: "Encourage the team to keep going", color: "red" },
      { text: "Refocus on the system", color: "green" },
      { text: "Suggest a fresh approach", color: "blue" },
    ]},
    { id: 4, stage: "Performance", question: "My teammates would describe me as…", options: [
      { text: "Reliable and hardworking", color: "yellow" },
      { text: "Positive and uplifting", color: "red" },
      { text: "Organized and disciplined", color: "green" },
      { text: "Creative and surprising", color: "blue" },
    ]},
    { id: 5, stage: "Performance", question: "I feel most successful when…", options: [
      { text: "Execution is sharp and results come", color: "yellow" },
      { text: "Team morale is high because of me", color: "red" },
      { text: "The plan is followed and works well", color: "green" },
      { text: "Innovation changes the game", color: "blue" },
    ]},
    
    // Section B: Teamwork & Communication (Q6–Q10)
    { id: 6, stage: "Teamwork", question: "In team huddles, I usually…", options: [
      { text: "Focus on actions we need to take", color: "yellow" },
      { text: "Pump up the team with energy", color: "red" },
      { text: "Clarify instructions and strategy", color: "green" },
      { text: "Suggest a creative twist", color: "blue" },
    ]},
    { id: 7, stage: "Teamwork", question: "My teammates rely on me for…", options: [
      { text: "Work ethic and discipline", color: "yellow" },
      { text: "Energy and motivation", color: "red" },
      { text: "Organization and logic", color: "green" },
      { text: "Innovation and fresh plays", color: "blue" },
    ]},
    { id: 8, stage: "Teamwork", question: "My communication style is…", options: [
      { text: "Direct and straightforward", color: "yellow" },
      { text: "Expressive and passionate", color: "red" },
      { text: "Clear and structured", color: "green" },
      { text: "Visionary and creative", color: "blue" },
    ]},
    { id: 9, stage: "Teamwork", question: "I get frustrated when…", options: [
      { text: "Effort is low", color: "yellow" },
      { text: "Enthusiasm drops", color: "red" },
      { text: "People ignore the system", color: "green" },
      { text: "Ideas are shut down", color: "blue" },
    ]},
    { id: 10, stage: "Teamwork", question: "I contribute to team culture by…", options: [
      { text: "Leading with hard work", color: "yellow" },
      { text: "Motivating others with energy", color: "red" },
      { text: "Maintaining order and strategy", color: "green" },
      { text: "Encouraging creativity and experimentation", color: "blue" },
    ]},
    
    // Section C: Problem-Solving & Discipline (Q11–Q15)
    { id: 11, stage: "Problem-Solving", question: "When mistakes happen, I…", options: [
      { text: "Fix them immediately with action", color: "yellow" },
      { text: "Reassure teammates", color: "red" },
      { text: "Analyze and adjust systematically", color: "green" },
      { text: "Pivot with a new idea", color: "blue" },
    ]},
    { id: 12, stage: "Problem-Solving", question: "I trust decisions most when…", options: [
      { text: "They lead to fast results", color: "yellow" },
      { text: "They lift team morale", color: "red" },
      { text: "They are backed by logic", color: "green" },
      { text: "They introduce a creative opportunity", color: "blue" },
    ]},
    { id: 13, stage: "Problem-Solving", question: "In tough moments, my strength is…", options: [
      { text: "Staying disciplined under pressure", color: "yellow" },
      { text: "Encouraging others", color: "red" },
      { text: "Keeping order and structure", color: "green" },
      { text: "Creating something unexpected", color: "blue" },
    ]},
    { id: 14, stage: "Problem-Solving", question: "During timeouts, I usually…", options: [
      { text: "Focus on action steps", color: "yellow" },
      { text: "Motivate teammates energetically", color: "red" },
      { text: "Clarify strategy logically", color: "green" },
      { text: "Suggest a surprising adjustment", color: "blue" },
    ]},
    { id: 15, stage: "Problem-Solving", question: "If a plan fails, I…", options: [
      { text: "Try another approach immediately", color: "yellow" },
      { text: "Keep morale high", color: "red" },
      { text: "Reassess step by step", color: "green" },
      { text: "Pivot creatively", color: "blue" },
    ]},
    
    // Section D: Adaptability & Innovation (Q16–Q20)
    { id: 16, stage: "Adaptability", question: "When opponents change tactics, I…", options: [
      { text: "Respond immediately with action", color: "yellow" },
      { text: "Encourage confidence in the team", color: "red" },
      { text: "Adjust systematically", color: "green" },
      { text: "Experiment with new moves", color: "blue" },
    ]},
    { id: 17, stage: "Adaptability", question: "I learn best when…", options: [
      { text: "Practicing drills hands-on", color: "yellow" },
      { text: "Inspired by coaches or teammates", color: "red" },
      { text: "Breaking down plays logically", color: "green" },
      { text: "Experimenting during practice", color: "blue" },
    ]},
    { id: 18, stage: "Adaptability", question: "I'm most energized when…", options: [
      { text: "I'm working hard and executing", color: "yellow" },
      { text: "The energy is contagious", color: "red" },
      { text: "The strategy is clear", color: "green" },
      { text: "I'm trying creative plays", color: "blue" },
    ]},
    { id: 19, stage: "Adaptability", question: "My favorite type of training is…", options: [
      { text: "Intense, results-driven drills", color: "yellow" },
      { text: "Energizing team activities", color: "red" },
      { text: "Structured skill-building", color: "green" },
      { text: "Open-ended experimentation", color: "blue" },
    ]},
    { id: 20, stage: "Adaptability", question: "When plans break down, I…", options: [
      { text: "Take immediate action", color: "yellow" },
      { text: "Keep the team motivated", color: "red" },
      { text: "Rebuild logically", color: "green" },
      { text: "Pivot creatively", color: "blue" },
    ]},
    
    // Section E: Self-Awareness & Reflection (Q21–Q25)
    { id: 21, stage: "Self-Awareness", question: "My biggest athletic strength is…", options: [
      { text: "Discipline and execution", color: "yellow" },
      { text: "Energy and motivation", color: "red" },
      { text: "Organization and strategy", color: "green" },
      { text: "Creativity and innovation", color: "blue" },
    ]},
    { id: 22, stage: "Self-Awareness", question: "I measure success by…", options: [
      { text: "Wins and results", color: "yellow" },
      { text: "People I've inspired", color: "red" },
      { text: "Strategy executed well", color: "green" },
      { text: "Innovation shown in play", color: "blue" },
    ]},
    { id: 23, stage: "Self-Awareness", question: "I get most frustrated when…", options: [
      { text: "Effort is missing", color: "yellow" },
      { text: "Passion is gone", color: "red" },
      { text: "Discipline is ignored", color: "green" },
      { text: "Creativity is stifled", color: "blue" },
    ]},
    { id: 24, stage: "Self-Awareness", question: "My coach/teammates usually notice that I…", options: [
      { text: "Work hard consistently", color: "yellow" },
      { text: "Motivate and uplift others", color: "red" },
      { text: "Keep things structured", color: "green" },
      { text: "Share creative ideas", color: "blue" },
    ]},
    { id: 25, stage: "Self-Awareness", question: "Ultimately, I want to be remembered as…", options: [
      { text: "A reliable performer", color: "yellow" },
      { text: "An inspiring teammate/coach", color: "red" },
      { text: "A disciplined strategist", color: "green" },
      { text: "A creative game-changer", color: "blue" },
    ]},
  ],
};

export const getAudienceContext = (audienceType: AudienceType): string => {
  switch (audienceType) {
    case "student":
      return "This is how your RoleColor affects group projects.";
    case "teacher": 
      return "This is how your RoleColor influences teaching teamwork.";
    case "professional":
      return "This is how your RoleColor guides workplace collaboration.";
    case "entrepreneur":
      return "This is how your RoleColor shapes your leadership style.";
    case "executive":
      return "This is how your RoleColor drives organizational success.";
    case "manager":
      return "This is how your RoleColor impacts team management.";
    case "coach":
      return "This is how your RoleColor influences athletic performance.";
    default:
      return "This is how your RoleColor guides your collaboration style.";
  }
};