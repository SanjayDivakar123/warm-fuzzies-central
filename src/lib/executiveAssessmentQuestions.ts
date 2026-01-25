export interface ExecutiveQuestion {
  id?: number;
  section: string;
  question: string;
  options: {
    text: string;
    color: "yellow" | "red" | "green" | "blue";
  }[];
}

export const executiveQuestions25Q: ExecutiveQuestion[] = [
  // Section A: Vision & Strategy (Q1–Q5)
  {
    section: "Vision & Strategy",
    question: "When setting direction, I usually…",
    options: [
      { text: "Move into execution quickly", color: "yellow" },
      { text: "Inspire others with an energizing vision", color: "red" },
      { text: "Build structured, strategic plans", color: "green" },
      { text: "Explore innovative approaches to the future", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "A successful executive is defined by…",
    options: [
      { text: "Delivering results efficiently", color: "yellow" },
      { text: "Inspiring people at every level", color: "red" },
      { text: "Establishing order and accountability", color: "green" },
      { text: "Driving innovation and change", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "When launching initiatives, I…",
    options: [
      { text: "Push for immediate action", color: "yellow" },
      { text: "Communicate mission and purpose broadly", color: "red" },
      { text: "Define milestones and structure clearly", color: "green" },
      { text: "Encourage experimentation", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "In my organization, I want to be known as…",
    options: [
      { text: "The one who gets results", color: "yellow" },
      { text: "The one who inspires a shared vision", color: "red" },
      { text: "The one who provides stability and systems", color: "green" },
      { text: "The one who brings breakthrough ideas", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "My biggest strength in leadership is…",
    options: [
      { text: "Decisive action", color: "yellow" },
      { text: "Motivating people", color: "red" },
      { text: "Strategic clarity", color: "green" },
      { text: "Creative foresight", color: "blue" },
    ],
  },
  // Section B: Collaboration & Culture (Q6–Q10)
  {
    section: "Collaboration & Culture",
    question: "In executive meetings, I usually…",
    options: [
      { text: "Drive decisions and outcomes", color: "yellow" },
      { text: "Energize the room with inspiration", color: "red" },
      { text: "Clarify structure and responsibilities", color: "green" },
      { text: "Suggest forward-looking ideas", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "My colleagues rely on me to…",
    options: [
      { text: "Ensure things move forward fast", color: "yellow" },
      { text: "Keep morale and energy high", color: "red" },
      { text: "Provide order and processes", color: "green" },
      { text: "Bring innovation to the table", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "I believe culture is built by…",
    options: [
      { text: "Executing and achieving goals", color: "yellow" },
      { text: "Inspiring shared values", color: "red" },
      { text: "Defining systems and accountability", color: "green" },
      { text: "Encouraging creativity and experimentation", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "When conflict arises among leaders, I…",
    options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Motivate reconciliation through vision", color: "red" },
      { text: "Analyze logically to find fairness", color: "green" },
      { text: "Reframe with new possibilities", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "The culture I strive to create is…",
    options: [
      { text: "Fast-moving and results-driven", color: "yellow" },
      { text: "Purposeful and inspiring", color: "red" },
      { text: "Structured and reliable", color: "green" },
      { text: "Innovative and future-oriented", color: "blue" },
    ],
  },
  // Section C: Decision-Making & Problem-Solving (Q11–Q15)
  {
    section: "Decision-Making & Problem-Solving",
    question: "When facing a major decision, I first…",
    options: [
      { text: "Take decisive action quickly", color: "yellow" },
      { text: "Consider the inspirational impact", color: "red" },
      { text: "Break it into logical parts", color: "green" },
      { text: "Explore new approaches", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "My decision-making strength is…",
    options: [
      { text: "Speed and confidence", color: "yellow" },
      { text: "Vision and persuasion", color: "red" },
      { text: "Structure and analysis", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "In crises, I…",
    options: [
      { text: "Act fast to stabilize", color: "yellow" },
      { text: "Motivate others to stay hopeful", color: "red" },
      { text: "Systematically solve the issue", color: "green" },
      { text: "Redesign the approach innovatively", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "I measure success by…",
    options: [
      { text: "Results achieved", color: "yellow" },
      { text: "People inspired", color: "red" },
      { text: "Systems sustained", color: "green" },
      { text: "Innovations created", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "If a decision backfires, I…",
    options: [
      { text: "Pivot into action immediately", color: "yellow" },
      { text: "Keep morale strong", color: "red" },
      { text: "Reassess systematically", color: "green" },
      { text: "Reframe and pivot creatively", color: "blue" },
    ],
  },
  // Section D: Adaptability & Innovation (Q16–Q20)
  {
    section: "Adaptability & Innovation",
    question: "When markets or policies shift, I…",
    options: [
      { text: "Act quickly to adapt strategy", color: "yellow" },
      { text: "Rally people to stay confident", color: "red" },
      { text: "Adjust systems carefully", color: "green" },
      { text: "Innovate a new pathway", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "I stay energized when…",
    options: [
      { text: "Projects show quick wins", color: "yellow" },
      { text: "People are inspired around me", color: "red" },
      { text: "Work is structured and clear", color: "green" },
      { text: "Creative ideas flow freely", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "My adaptability comes from…",
    options: [
      { text: "Decisive action regardless of change", color: "yellow" },
      { text: "Positivity and motivating others", color: "red" },
      { text: "Careful restructuring", color: "green" },
      { text: "Rethinking problems creatively", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "The projects I enjoy most are…",
    options: [
      { text: "Fast-paced and goal-driven", color: "yellow" },
      { text: "Inspiring and people-centered", color: "red" },
      { text: "Structured and process-oriented", color: "green" },
      { text: "Experimental and innovative", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "In moments of disruption, I…",
    options: [
      { text: "Push into action immediately", color: "yellow" },
      { text: "Keep the team motivated", color: "red" },
      { text: "Re-plan logically step by step", color: "green" },
      { text: "Find creative alternatives", color: "blue" },
    ],
  },
  // Section E: Self-Awareness & Reflection (Q21–Q25)
  {
    section: "Self-Awareness & Reflection",
    question: "My leadership legacy should be…",
    options: [
      { text: "Getting things done", color: "yellow" },
      { text: "Inspiring people widely", color: "red" },
      { text: "Building stable systems", color: "green" },
      { text: "Creating innovation", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "I get frustrated when…",
    options: [
      { text: "Action is delayed", color: "yellow" },
      { text: "Energy is low", color: "red" },
      { text: "Processes are messy", color: "green" },
      { text: "New ideas are dismissed", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "I learn best when…",
    options: [
      { text: "I can apply knowledge right away", color: "yellow" },
      { text: "It connects to people and vision", color: "red" },
      { text: "It's systematic and logical", color: "green" },
      { text: "It's open to experimentation", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "My colleagues usually notice that I…",
    options: [
      { text: "Push things into motion", color: "yellow" },
      { text: "Motivate and inspire constantly", color: "red" },
      { text: "Provide clarity and structure", color: "green" },
      { text: "Offer creative, new ideas", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be remembered as…",
    options: [
      { text: "A doer who delivered results", color: "yellow" },
      { text: "A motivator who uplifted others", color: "red" },
      { text: "A strategist who built stability", color: "green" },
      { text: "A visionary who sparked innovation", color: "blue" },
    ],
  },
];

export const executiveQuestions50Q: ExecutiveQuestion[] = [
  // Section A: Vision & Strategy (Q1–Q10)
  {
    section: "Vision & Strategy",
    question: "When setting a long-term vision, I usually…",
    options: [
      { text: "Define immediate action steps to begin moving", color: "yellow" },
      { text: "Share an inspiring message that rallies people", color: "red" },
      { text: "Build a detailed strategic roadmap", color: "green" },
      { text: "Explore disruptive, future-focused opportunities", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "For me, a successful leader is one who…",
    options: [
      { text: "Executes and delivers results quickly", color: "yellow" },
      { text: "Inspires belief and loyalty in people", color: "red" },
      { text: "Establishes systems for lasting stability", color: "green" },
      { text: "Creates innovative change that shapes the future", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "When announcing a new initiative, I prefer to…",
    options: [
      { text: "Roll out an action plan immediately", color: "yellow" },
      { text: "Deliver a motivational message to energize stakeholders", color: "red" },
      { text: "Share structured goals and timelines", color: "green" },
      { text: "Frame it as a bold, innovative move", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "In moments of uncertainty, I…",
    options: [
      { text: "Make quick, decisive moves", color: "yellow" },
      { text: "Reassure and inspire my people", color: "red" },
      { text: "Analyze scenarios carefully", color: "green" },
      { text: "Propose creative new paths forward", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "My colleagues most often describe me as…",
    options: [
      { text: "The one who gets things done", color: "yellow" },
      { text: "The one who inspires and motivates", color: "red" },
      { text: "The one who organizes and structures", color: "green" },
      { text: "The one who innovates and thinks ahead", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "When communicating vision, I…",
    options: [
      { text: "Focus on next steps and execution", color: "yellow" },
      { text: "Inspire with passion and storytelling", color: "red" },
      { text: "Clarify logical frameworks and goals", color: "green" },
      { text: "Highlight innovation and differentiation", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "I feel proudest as a leader when…",
    options: [
      { text: "We achieve results quickly", color: "yellow" },
      { text: "People feel deeply motivated", color: "red" },
      { text: "Systems and strategies work smoothly", color: "green" },
      { text: "We pioneer something new in the field", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "The hardest thing for me is…",
    options: [
      { text: "Waiting without acting", color: "yellow" },
      { text: "Leading without inspiration", color: "red" },
      { text: "Operating in chaos without structure", color: "green" },
      { text: "Working under rigid, uncreative rules", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "My definition of legacy is…",
    options: [
      { text: "Driving measurable impact fast", color: "yellow" },
      { text: "Inspiring generations of people", color: "red" },
      { text: "Building lasting systems of order", color: "green" },
      { text: "Leaving behind innovation and disruption", color: "blue" },
    ],
  },
  {
    section: "Vision & Strategy",
    question: "I see my executive role as…",
    options: [
      { text: "The driver of execution", color: "yellow" },
      { text: "The motivator of culture", color: "red" },
      { text: "The architect of structure", color: "green" },
      { text: "The visionary of the future", color: "blue" },
    ],
  },
  // Section B: Collaboration & Culture (Q11–Q20)
  {
    section: "Collaboration & Culture",
    question: "In executive meetings, I usually…",
    options: [
      { text: "Push discussions toward decisions", color: "yellow" },
      { text: "Energize colleagues with passion", color: "red" },
      { text: "Ensure clarity and alignment", color: "green" },
      { text: "Propose bold, creative strategies", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "My colleagues rely on me to…",
    options: [
      { text: "Move projects forward fast", color: "yellow" },
      { text: "Lift morale and inspire commitment", color: "red" },
      { text: "Provide order and detail", color: "green" },
      { text: "Suggest new ways to innovate", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "My communication style is…",
    options: [
      { text: "Direct and actionable", color: "yellow" },
      { text: "Story-driven and expressive", color: "red" },
      { text: "Clear and logical", color: "green" },
      { text: "Visionary and conceptual", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "In shaping culture, I focus on…",
    options: [
      { text: "Execution and achievement", color: "yellow" },
      { text: "Inspiration and values", color: "red" },
      { text: "Structure and accountability", color: "green" },
      { text: "Creativity and adaptability", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "When conflict arises, I…",
    options: [
      { text: "Push for a quick resolution", color: "yellow" },
      { text: "Motivate reconciliation through empathy", color: "red" },
      { text: "Analyze each side logically", color: "green" },
      { text: "Reframe the issue innovatively", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "In partnerships, I contribute most by…",
    options: [
      { text: "Driving execution fast", color: "yellow" },
      { text: "Inspiring and connecting people", color: "red" },
      { text: "Structuring systems for clarity", color: "green" },
      { text: "Innovating ideas and solutions", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "I get frustrated when…",
    options: [
      { text: "Action is delayed", color: "yellow" },
      { text: "Energy is low", color: "red" },
      { text: "Systems are messy", color: "green" },
      { text: "Innovation is blocked", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "In staff meetings, I…",
    options: [
      { text: "Push for decisions and results", color: "yellow" },
      { text: "Motivate people with passion", color: "red" },
      { text: "Clarify and structure discussions", color: "green" },
      { text: "Ask \"what if\" questions to inspire change", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "The culture I strive to build is…",
    options: [
      { text: "Fast-moving and efficient", color: "yellow" },
      { text: "Inspiring and mission-driven", color: "red" },
      { text: "Organized and stable", color: "green" },
      { text: "Innovative and forward-looking", color: "blue" },
    ],
  },
  {
    section: "Collaboration & Culture",
    question: "I believe school/company culture thrives when…",
    options: [
      { text: "Execution is consistent", color: "yellow" },
      { text: "People are motivated", color: "red" },
      { text: "Structures are strong", color: "green" },
      { text: "Creativity is encouraged", color: "blue" },
    ],
  },
  // Section C: Decision-Making & Problem-Solving (Q21–Q30)
  {
    section: "Decision-Making & Problem-Solving",
    question: "When making major decisions, I first…",
    options: [
      { text: "Act quickly to gain momentum", color: "yellow" },
      { text: "Consider how it inspires people", color: "red" },
      { text: "Break it into logical steps", color: "green" },
      { text: "Explore new possibilities", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "My strength in problem-solving is…",
    options: [
      { text: "Determination and speed", color: "yellow" },
      { text: "Motivation and persuasion", color: "red" },
      { text: "Clarity and analysis", color: "green" },
      { text: "Creativity and originality", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "In high-pressure moments, I…",
    options: [
      { text: "Take control decisively", color: "yellow" },
      { text: "Encourage others to stay positive", color: "red" },
      { text: "Reassess logically", color: "green" },
      { text: "Rethink the challenge creatively", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "I prefer instructions that are…",
    options: [
      { text: "Short and actionable", color: "yellow" },
      { text: "Inspirational and people-focused", color: "red" },
      { text: "Detailed and structured", color: "green" },
      { text: "Flexible and open-ended", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "In crises, I…",
    options: [
      { text: "Act fast to stabilize the situation", color: "yellow" },
      { text: "Motivate confidence in others", color: "red" },
      { text: "Step back to analyze the facts", color: "green" },
      { text: "Innovate a different approach", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "I measure success by…",
    options: [
      { text: "Achieving results fast", color: "yellow" },
      { text: "Inspiring loyalty and culture", color: "red" },
      { text: "Building long-term structures", color: "green" },
      { text: "Creating meaningful innovation", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "If a decision backfires, I…",
    options: [
      { text: "Try another path immediately", color: "yellow" },
      { text: "Keep morale high despite setbacks", color: "red" },
      { text: "Reanalyze systematically", color: "green" },
      { text: "Pivot creatively", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "In a debate, I…",
    options: [
      { text: "Push toward conclusion fast", color: "yellow" },
      { text: "Persuade with passion", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Offer fresh perspectives", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "I feel strongest as a leader when…",
    options: [
      { text: "Executing under deadlines", color: "yellow" },
      { text: "Motivating people toward a goal", color: "red" },
      { text: "Structuring complex challenges", color: "green" },
      { text: "Disrupting with innovation", color: "blue" },
    ],
  },
  {
    section: "Decision-Making & Problem-Solving",
    question: "The role I play best in strategy is…",
    options: [
      { text: "The implementer", color: "yellow" },
      { text: "The communicator", color: "red" },
      { text: "The planner", color: "green" },
      { text: "The innovator", color: "blue" },
    ],
  },
  // Section D: Adaptability & Innovation (Q31–Q40)
  {
    section: "Adaptability & Innovation",
    question: "I handle industry disruption by…",
    options: [
      { text: "Acting quickly with new strategies", color: "yellow" },
      { text: "Motivating stakeholders with optimism", color: "red" },
      { text: "Adjusting systems step by step", color: "green" },
      { text: "Creating innovative solutions", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "I learn best when…",
    options: [
      { text: "I can apply knowledge immediately", color: "yellow" },
      { text: "It connects to people and vision", color: "red" },
      { text: "It's presented systematically", color: "green" },
      { text: "It's open to experimentation", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "I enjoy projects that are…",
    options: [
      { text: "Fast-paced and practical", color: "yellow" },
      { text: "Inspiring and people-driven", color: "red" },
      { text: "Structured and detailed", color: "green" },
      { text: "Creative and open-ended", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "My adaptability comes from…",
    options: [
      { text: "Speed of action", color: "yellow" },
      { text: "Optimism and morale-boosting", color: "red" },
      { text: "Careful step-by-step adjustment", color: "green" },
      { text: "Rethinking everything creatively", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "I stay energized when…",
    options: [
      { text: "Work is moving quickly", color: "yellow" },
      { text: "People are motivated", color: "red" },
      { text: "Systems are clear and logical", color: "green" },
      { text: "Innovation is happening", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "When testing new initiatives, I…",
    options: [
      { text: "Roll them out immediately", color: "yellow" },
      { text: "Build excitement around them", color: "red" },
      { text: "Research thoroughly before launch", color: "green" },
      { text: "Experiment boldly", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "My organization thrives when…",
    options: [
      { text: "Execution is strong", color: "yellow" },
      { text: "Inspiration runs high", color: "red" },
      { text: "Processes are clear", color: "green" },
      { text: "Innovation is constant", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "In disrupted plans, I…",
    options: [
      { text: "Act quickly with a backup plan", color: "yellow" },
      { text: "Keep others motivated", color: "red" },
      { text: "Re-plan logically", color: "green" },
      { text: "Reframe with creativity", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "The work I enjoy most is…",
    options: [
      { text: "Execution-focused", color: "yellow" },
      { text: "Mission-driven", color: "red" },
      { text: "Structured and methodical", color: "green" },
      { text: "Creative and disruptive", color: "blue" },
    ],
  },
  {
    section: "Adaptability & Innovation",
    question: "I thrive when I can…",
    options: [
      { text: "Drive performance", color: "yellow" },
      { text: "Inspire people", color: "red" },
      { text: "Organize structures", color: "green" },
      { text: "Pioneer innovation", color: "blue" },
    ],
  },
  // Section E: Self-Awareness & Reflection (Q41–Q50)
  {
    section: "Self-Awareness & Reflection",
    question: "My biggest strength as a leader is…",
    options: [
      { text: "Action and results", color: "yellow" },
      { text: "Motivation and inspiration", color: "red" },
      { text: "Logic and structure", color: "green" },
      { text: "Creativity and innovation", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "I get most frustrated when…",
    options: [
      { text: "Decisions stall", color: "yellow" },
      { text: "Energy and enthusiasm are missing", color: "red" },
      { text: "Processes are unclear", color: "green" },
      { text: "New ideas are dismissed", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "I measure my leadership growth by…",
    options: [
      { text: "What I've executed", color: "yellow" },
      { text: "Who I've inspired", color: "red" },
      { text: "What I've structured", color: "green" },
      { text: "What I've innovated", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "My colleagues notice that I…",
    options: [
      { text: "Act decisively", color: "yellow" },
      { text: "Inspire with passion", color: "red" },
      { text: "Provide clarity", color: "green" },
      { text: "Share new ideas", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "My proudest leadership moments come when…",
    options: [
      { text: "Results are achieved quickly", color: "yellow" },
      { text: "People are motivated to rise higher", color: "red" },
      { text: "Systems work seamlessly", color: "green" },
      { text: "Innovation changes the game", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "The hardest thing for me is…",
    options: [
      { text: "Waiting without acting", color: "yellow" },
      { text: "Leading without passion", color: "red" },
      { text: "Operating without order", color: "green" },
      { text: "Being forced to stay conventional", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "My leadership style is…",
    options: [
      { text: "Direct and decisive", color: "yellow" },
      { text: "Motivational and people-driven", color: "red" },
      { text: "Logical and structured", color: "green" },
      { text: "Creative and visionary", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "I gain energy when…",
    options: [
      { text: "Driving fast execution", color: "yellow" },
      { text: "Inspiring others", color: "red" },
      { text: "Solving strategic problems", color: "green" },
      { text: "Imagining new futures", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "My preferred executive role is…",
    options: [
      { text: "The driver", color: "yellow" },
      { text: "The communicator", color: "red" },
      { text: "The strategist", color: "green" },
      { text: "The innovator", color: "blue" },
    ],
  },
  {
    section: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be remembered as…",
    options: [
      { text: "A results-driven doer", color: "yellow" },
      { text: "A visionary motivator", color: "red" },
      { text: "A strategic builder", color: "green" },
      { text: "A disruptive innovator", color: "blue" },
    ],
  },
];
