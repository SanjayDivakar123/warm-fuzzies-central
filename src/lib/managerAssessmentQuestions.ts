export interface ManagerQuestion {
  id: number;
  section: string;
  question: string;
  options: {
    text: string;
    color: "yellow" | "red" | "green" | "blue";
  }[];
}

export const managerQuestions25Q: ManagerQuestion[] = [
  // Section A: Leadership & Initiative (Q1–Q5)
  {
    id: 1,
    section: "Leadership & Initiative",
    question: "When my team starts a project, I usually…",
    options: [
      { text: "Define tasks and move into action quickly", color: "yellow" },
      { text: "Inspire the team with energy and purpose", color: "red" },
      { text: "Build a structured plan with timelines", color: "green" },
      { text: "Brainstorm creative approaches first", color: "blue" },
    ],
  },
  {
    id: 2,
    section: "Leadership & Initiative",
    question: "My biggest strength as a manager is…",
    options: [
      { text: "Taking decisive action", color: "yellow" },
      { text: "Motivating and supporting people", color: "red" },
      { text: "Organizing processes logically", color: "green" },
      { text: "Designing new ways to improve", color: "blue" },
    ],
  },
  {
    id: 3,
    section: "Leadership & Initiative",
    question: "Deadlines motivate me to…",
    options: [
      { text: "Push for fast results", color: "yellow" },
      { text: "Rally people to give their best effort", color: "red" },
      { text: "Reorder priorities systematically", color: "green" },
      { text: "Find inventive shortcuts to deliver", color: "blue" },
    ],
  },
  {
    id: 4,
    section: "Leadership & Initiative",
    question: "My team would describe me as…",
    options: [
      { text: "The one who gets things done", color: "yellow" },
      { text: "The one who inspires and energizes", color: "red" },
      { text: "The one who keeps everything on track", color: "green" },
      { text: "The one who brings creative ideas", color: "blue" },
    ],
  },
  {
    id: 5,
    section: "Leadership & Initiative",
    question: "I feel most accomplished as a leader when…",
    options: [
      { text: "My team executes efficiently", color: "yellow" },
      { text: "My team feels motivated and united", color: "red" },
      { text: "Systems are working smoothly", color: "green" },
      { text: "We've created something new and valuable", color: "blue" },
    ],
  },
  // Section B: Collaboration & Communication (Q6–Q10)
  {
    id: 6,
    section: "Collaboration & Communication",
    question: "In team meetings, I tend to…",
    options: [
      { text: "Push for decisions and next steps", color: "yellow" },
      { text: "Motivate people with positivity", color: "red" },
      { text: "Clarify structure and responsibilities", color: "green" },
      { text: "Spark creative thinking", color: "blue" },
    ],
  },
  {
    id: 7,
    section: "Collaboration & Communication",
    question: "My team relies on me for…",
    options: [
      { text: "Fast execution", color: "yellow" },
      { text: "Encouragement and energy", color: "red" },
      { text: "Clear organization", color: "green" },
      { text: "Creative solutions", color: "blue" },
    ],
  },
  {
    id: 8,
    section: "Collaboration & Communication",
    question: "My communication style is…",
    options: [
      { text: "Direct and action-oriented", color: "yellow" },
      { text: "Expressive and inspiring", color: "red" },
      { text: "Clear and detailed", color: "green" },
      { text: "Conceptual and visionary", color: "blue" },
    ],
  },
  {
    id: 9,
    section: "Collaboration & Communication",
    question: "I get most frustrated when…",
    options: [
      { text: "Progress slows down", color: "yellow" },
      { text: "Morale drops", color: "red" },
      { text: "Plans get messy", color: "green" },
      { text: "New ideas are ignored", color: "blue" },
    ],
  },
  {
    id: 10,
    section: "Collaboration & Communication",
    question: "I contribute to workplace culture by…",
    options: [
      { text: "Driving execution and results", color: "yellow" },
      { text: "Building team spirit", color: "red" },
      { text: "Keeping systems efficient", color: "green" },
      { text: "Encouraging innovation", color: "blue" },
    ],
  },
  // Section C: Problem-Solving & Decision-Making (Q11–Q15)
  {
    id: 11,
    section: "Problem-Solving & Decision-Making",
    question: "When problems arise, I first…",
    options: [
      { text: "Act quickly to resolve them", color: "yellow" },
      { text: "Keep the team's morale strong", color: "red" },
      { text: "Break the problem into parts", color: "green" },
      { text: "Reframe with a fresh idea", color: "blue" },
    ],
  },
  {
    id: 12,
    section: "Problem-Solving & Decision-Making",
    question: "I trust my decisions most when…",
    options: [
      { text: "They deliver fast results", color: "yellow" },
      { text: "They inspire the team", color: "red" },
      { text: "They're backed by data", color: "green" },
      { text: "They create new opportunities", color: "blue" },
    ],
  },
  {
    id: 13,
    section: "Problem-Solving & Decision-Making",
    question: "My problem-solving style is…",
    options: [
      { text: "Determined and fast-moving", color: "yellow" },
      { text: "Motivational and people-focused", color: "red" },
      { text: "Analytical and structured", color: "green" },
      { text: "Creative and imaginative", color: "blue" },
    ],
  },
  {
    id: 14,
    section: "Problem-Solving & Decision-Making",
    question: "In discussions, I usually…",
    options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Persuade with energy and vision", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Share new perspectives", color: "blue" },
    ],
  },
  {
    id: 15,
    section: "Problem-Solving & Decision-Making",
    question: "If my first plan fails, I…",
    options: [
      { text: "Try something else right away", color: "yellow" },
      { text: "Keep people motivated", color: "red" },
      { text: "Reanalyze carefully", color: "green" },
      { text: "Pivot creatively", color: "blue" },
    ],
  },
  // Section D: Adaptability & Innovation (Q16–Q20)
  {
    id: 16,
    section: "Adaptability & Innovation",
    question: "When unexpected changes happen, I…",
    options: [
      { text: "Adjust quickly and move forward", color: "yellow" },
      { text: "Stay positive and reassure others", color: "red" },
      { text: "Re-plan systematically", color: "green" },
      { text: "Pivot to a creative alternative", color: "blue" },
    ],
  },
  {
    id: 17,
    section: "Adaptability & Innovation",
    question: "I learn best when…",
    options: [
      { text: "I can apply it immediately", color: "yellow" },
      { text: "It's connected to people and purpose", color: "red" },
      { text: "It's explained step by step", color: "green" },
      { text: "It's open to experimentation", color: "blue" },
    ],
  },
  {
    id: 18,
    section: "Adaptability & Innovation",
    question: "I'm most energized when…",
    options: [
      { text: "Work is moving fast", color: "yellow" },
      { text: "People are engaged and motivated", color: "red" },
      { text: "Systems are running smoothly", color: "green" },
      { text: "Ideas are flowing freely", color: "blue" },
    ],
  },
  {
    id: 19,
    section: "Adaptability & Innovation",
    question: "The projects I enjoy most are…",
    options: [
      { text: "Fast-paced and practical", color: "yellow" },
      { text: "People-driven and inspiring", color: "red" },
      { text: "Structured and methodical", color: "green" },
      { text: "Innovative and experimental", color: "blue" },
    ],
  },
  {
    id: 20,
    section: "Adaptability & Innovation",
    question: "When plans get disrupted, I…",
    options: [
      { text: "Push into action quickly", color: "yellow" },
      { text: "Keep morale high", color: "red" },
      { text: "Reassess logically", color: "green" },
      { text: "Reframe with creativity", color: "blue" },
    ],
  },
  // Section E: Self-Awareness & Reflection (Q21–Q25)
  {
    id: 21,
    section: "Self-Awareness & Reflection",
    question: "My biggest management strength is…",
    options: [
      { text: "Execution and action", color: "yellow" },
      { text: "Motivation and inspiration", color: "red" },
      { text: "Organization and logic", color: "green" },
      { text: "Creativity and innovation", color: "blue" },
    ],
  },
  {
    id: 22,
    section: "Self-Awareness & Reflection",
    question: "I measure my growth by…",
    options: [
      { text: "What I've accomplished", color: "yellow" },
      { text: "Who I've inspired", color: "red" },
      { text: "What I've structured or improved", color: "green" },
      { text: "What I've innovated", color: "blue" },
    ],
  },
  {
    id: 23,
    section: "Self-Awareness & Reflection",
    question: "I get most frustrated when…",
    options: [
      { text: "Progress slows", color: "yellow" },
      { text: "Energy is missing", color: "red" },
      { text: "Systems are unclear", color: "green" },
      { text: "Creativity is blocked", color: "blue" },
    ],
  },
  {
    id: 24,
    section: "Self-Awareness & Reflection",
    question: "My team usually notices that I…",
    options: [
      { text: "Push things into action", color: "yellow" },
      { text: "Lift energy and motivation", color: "red" },
      { text: "Keep order and clarity", color: "green" },
      { text: "Offer new ideas", color: "blue" },
    ],
  },
  {
    id: 25,
    section: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be known as…",
    options: [
      { text: "A manager who gets results", color: "yellow" },
      { text: "A manager who inspires people", color: "red" },
      { text: "A manager who builds structure", color: "green" },
      { text: "A manager who sparks innovation", color: "blue" },
    ],
  },
];

export const managerQuestions50Q: ManagerQuestion[] = [
  // Section A: Leadership & Initiative (Q1–Q10)
  {
    id: 1,
    section: "Leadership & Initiative",
    question: "When my team begins a project, I usually…",
    options: [
      { text: "Assign tasks and move into action quickly", color: "yellow" },
      { text: "Energize the group with enthusiasm", color: "red" },
      { text: "Outline a structured plan step by step", color: "green" },
      { text: "Brainstorm creative approaches before starting", color: "blue" },
    ],
  },
  {
    id: 2,
    section: "Leadership & Initiative",
    question: "A successful manager is someone who…",
    options: [
      { text: "Ensures tasks are executed effectively", color: "yellow" },
      { text: "Motivates people to give their best", color: "red" },
      { text: "Builds reliable systems and processes", color: "green" },
      { text: "Pushes for innovation and improvement", color: "blue" },
    ],
  },
  {
    id: 3,
    section: "Leadership & Initiative",
    question: "When deadlines approach, I…",
    options: [
      { text: "Push the team hard to deliver fast", color: "yellow" },
      { text: "Keep spirits high to sustain energy", color: "red" },
      { text: "Reorder tasks systematically", color: "green" },
      { text: "Find creative ways to meet goals", color: "blue" },
    ],
  },
  {
    id: 4,
    section: "Leadership & Initiative",
    question: "My leadership strength is…",
    options: [
      { text: "Getting things done quickly", color: "yellow" },
      { text: "Inspiring and encouraging people", color: "red" },
      { text: "Organizing for clarity", color: "green" },
      { text: "Innovating for improvement", color: "blue" },
    ],
  },
  {
    id: 5,
    section: "Leadership & Initiative",
    question: "My team would describe me as…",
    options: [
      { text: "The doer who ensures progress", color: "yellow" },
      { text: "The motivator who energizes everyone", color: "red" },
      { text: "The organizer who brings order", color: "green" },
      { text: "The creator who brings fresh ideas", color: "blue" },
    ],
  },
  {
    id: 6,
    section: "Leadership & Initiative",
    question: "When performance drops, I…",
    options: [
      { text: "Push harder to get back on track", color: "yellow" },
      { text: "Motivate and recognize effort", color: "red" },
      { text: "Rebuild the process for efficiency", color: "green" },
      { text: "Introduce a new approach to energize the team", color: "blue" },
    ],
  },
  {
    id: 7,
    section: "Leadership & Initiative",
    question: "I feel most satisfied as a leader when…",
    options: [
      { text: "Results are delivered on time", color: "yellow" },
      { text: "People are inspired and engaged", color: "red" },
      { text: "Processes work seamlessly", color: "green" },
      { text: "Something new is created", color: "blue" },
    ],
  },
  {
    id: 8,
    section: "Leadership & Initiative",
    question: "The hardest part of managing for me is…",
    options: [
      { text: "Holding back instead of acting fast", color: "yellow" },
      { text: "Working without passion in the team", color: "red" },
      { text: "Functioning in chaos without structure", color: "green" },
      { text: "Following rigid routines with no creativity", color: "blue" },
    ],
  },
  {
    id: 9,
    section: "Leadership & Initiative",
    question: "My definition of leadership legacy is…",
    options: [
      { text: "Projects delivered successfully", color: "yellow" },
      { text: "People inspired and uplifted", color: "red" },
      { text: "Systems that last beyond me", color: "green" },
      { text: "Innovations that change the game", color: "blue" },
    ],
  },
  {
    id: 10,
    section: "Leadership & Initiative",
    question: "As a manager, I see my role primarily as…",
    options: [
      { text: "The driver of action", color: "yellow" },
      { text: "The motivator of people", color: "red" },
      { text: "The architect of order", color: "green" },
      { text: "The innovator of possibilities", color: "blue" },
    ],
  },
  // Section B: Collaboration & Communication (Q11–Q20)
  {
    id: 11,
    section: "Collaboration & Communication",
    question: "In team meetings, I usually…",
    options: [
      { text: "Drive decisions quickly", color: "yellow" },
      { text: "Encourage and energize the group", color: "red" },
      { text: "Clarify plans and responsibilities", color: "green" },
      { text: "Inspire new brainstorming", color: "blue" },
    ],
  },
  {
    id: 12,
    section: "Collaboration & Communication",
    question: "My team relies on me to…",
    options: [
      { text: "Get things done under pressure", color: "yellow" },
      { text: "Boost morale", color: "red" },
      { text: "Keep work organized", color: "green" },
      { text: "Suggest fresh approaches", color: "blue" },
    ],
  },
  {
    id: 13,
    section: "Collaboration & Communication",
    question: "My communication style is…",
    options: [
      { text: "Direct and efficient", color: "yellow" },
      { text: "Expressive and people-focused", color: "red" },
      { text: "Clear and detail-oriented", color: "green" },
      { text: "Visionary and conceptual", color: "blue" },
    ],
  },
  {
    id: 14,
    section: "Collaboration & Communication",
    question: "When team conflict arises, I…",
    options: [
      { text: "Push for resolution fast", color: "yellow" },
      { text: "Motivate reconciliation through encouragement", color: "red" },
      { text: "Analyze both sides fairly", color: "green" },
      { text: "Reframe the problem creatively", color: "blue" },
    ],
  },
  {
    id: 15,
    section: "Collaboration & Communication",
    question: "My contribution to culture is…",
    options: [
      { text: "Driving accountability", color: "yellow" },
      { text: "Building positive energy", color: "red" },
      { text: "Maintaining systems and standards", color: "green" },
      { text: "Promoting experimentation", color: "blue" },
    ],
  },
  {
    id: 16,
    section: "Collaboration & Communication",
    question: "In collaborative projects, I…",
    options: [
      { text: "Take the lead on execution", color: "yellow" },
      { text: "Inspire people toward the goal", color: "red" },
      { text: "Organize tasks and workflows", color: "green" },
      { text: "Suggest innovative approaches", color: "blue" },
    ],
  },
  {
    id: 17,
    section: "Collaboration & Communication",
    question: "My colleagues count on me for…",
    options: [
      { text: "Speed and determination", color: "yellow" },
      { text: "Optimism and encouragement", color: "red" },
      { text: "Structure and clarity", color: "green" },
      { text: "Creativity and bold ideas", color: "blue" },
    ],
  },
  {
    id: 18,
    section: "Collaboration & Communication",
    question: "I get frustrated when…",
    options: [
      { text: "Progress slows down", color: "yellow" },
      { text: "Enthusiasm disappears", color: "red" },
      { text: "Processes break down", color: "green" },
      { text: "New ideas are shut down", color: "blue" },
    ],
  },
  {
    id: 19,
    section: "Collaboration & Communication",
    question: "In staff meetings, I…",
    options: [
      { text: "Push toward outcomes", color: "yellow" },
      { text: "Motivate the group with energy", color: "red" },
      { text: "Clarify plans logically", color: "green" },
      { text: "Ask \"what if\" questions to inspire innovation", color: "blue" },
    ],
  },
  {
    id: 20,
    section: "Collaboration & Communication",
    question: "I believe culture thrives when…",
    options: [
      { text: "Work gets done efficiently", color: "yellow" },
      { text: "People feel energized", color: "red" },
      { text: "Systems are reliable", color: "green" },
      { text: "Creativity is welcomed", color: "blue" },
    ],
  },
  // Section C: Problem-Solving & Decision-Making (Q21–Q30)
  {
    id: 21,
    section: "Problem-Solving & Decision-Making",
    question: "When problems appear, I first…",
    options: [
      { text: "Act immediately to fix them", color: "yellow" },
      { text: "Keep morale positive", color: "red" },
      { text: "Break them into logical steps", color: "green" },
      { text: "Reframe them with creativity", color: "blue" },
    ],
  },
  {
    id: 22,
    section: "Problem-Solving & Decision-Making",
    question: "My strength in decision-making is…",
    options: [
      { text: "Confidence and speed", color: "yellow" },
      { text: "Persuasion and inspiration", color: "red" },
      { text: "Logic and precision", color: "green" },
      { text: "Innovation and originality", color: "blue" },
    ],
  },
  {
    id: 23,
    section: "Problem-Solving & Decision-Making",
    question: "Under pressure, I…",
    options: [
      { text: "Push forward with action", color: "yellow" },
      { text: "Motivate others to keep calm", color: "red" },
      { text: "Focus on logic", color: "green" },
      { text: "Find alternative solutions", color: "blue" },
    ],
  },
  {
    id: 24,
    section: "Problem-Solving & Decision-Making",
    question: "I prefer instructions that are…",
    options: [
      { text: "Short and actionable", color: "yellow" },
      { text: "Motivating and people-centered", color: "red" },
      { text: "Detailed and systematic", color: "green" },
      { text: "Flexible and open", color: "blue" },
    ],
  },
  {
    id: 25,
    section: "Problem-Solving & Decision-Making",
    question: "In crises, I…",
    options: [
      { text: "Take control and act fast", color: "yellow" },
      { text: "Keep people encouraged", color: "red" },
      { text: "Step back to analyze thoroughly", color: "green" },
      { text: "Invent creative alternatives", color: "blue" },
    ],
  },
  {
    id: 26,
    section: "Problem-Solving & Decision-Making",
    question: "I measure success by…",
    options: [
      { text: "Results and outcomes delivered", color: "yellow" },
      { text: "People who are inspired", color: "red" },
      { text: "Systems improved", color: "green" },
      { text: "Innovations achieved", color: "blue" },
    ],
  },
  {
    id: 27,
    section: "Problem-Solving & Decision-Making",
    question: "If my decision fails, I…",
    options: [
      { text: "Try another approach quickly", color: "yellow" },
      { text: "Keep the team motivated", color: "red" },
      { text: "Reanalyze logically", color: "green" },
      { text: "Pivot creatively", color: "blue" },
    ],
  },
  {
    id: 28,
    section: "Problem-Solving & Decision-Making",
    question: "In discussions, I…",
    options: [
      { text: "Push for quick resolution", color: "yellow" },
      { text: "Persuade with energy", color: "red" },
      { text: "Use facts and logic", color: "green" },
      { text: "Offer fresh perspectives", color: "blue" },
    ],
  },
  {
    id: 29,
    section: "Problem-Solving & Decision-Making",
    question: "My role in problem-solving is usually…",
    options: [
      { text: "The one who acts", color: "yellow" },
      { text: "The one who motivates", color: "red" },
      { text: "The one who structures the process", color: "green" },
      { text: "The one who innovates", color: "blue" },
    ],
  },
  {
    id: 30,
    section: "Problem-Solving & Decision-Making",
    question: "I feel strongest as a leader when…",
    options: [
      { text: "Executing under deadlines", color: "yellow" },
      { text: "Motivating people to achieve", color: "red" },
      { text: "Creating structure out of chaos", color: "green" },
      { text: "Disrupting problems with new ideas", color: "blue" },
    ],
  },
  // Section D: Adaptability & Innovation (Q31–Q40)
  {
    id: 31,
    section: "Adaptability & Innovation",
    question: "When change hits my team, I…",
    options: [
      { text: "Adjust quickly with action", color: "yellow" },
      { text: "Reassure and energize everyone", color: "red" },
      { text: "Rebuild the plan step by step", color: "green" },
      { text: "Rethink the challenge creatively", color: "blue" },
    ],
  },
  {
    id: 32,
    section: "Adaptability & Innovation",
    question: "I learn best when…",
    options: [
      { text: "I can apply it right away", color: "yellow" },
      { text: "It's connected to people and purpose", color: "red" },
      { text: "It's structured systematically", color: "green" },
      { text: "It's open to experimentation", color: "blue" },
    ],
  },
  {
    id: 33,
    section: "Adaptability & Innovation",
    question: "The projects I enjoy most are…",
    options: [
      { text: "Fast-paced and goal-driven", color: "yellow" },
      { text: "Inspiring and people-focused", color: "red" },
      { text: "Structured and organized", color: "green" },
      { text: "Open-ended and innovative", color: "blue" },
    ],
  },
  {
    id: 34,
    section: "Adaptability & Innovation",
    question: "My adaptability comes from…",
    options: [
      { text: "Decisive action", color: "yellow" },
      { text: "Positivity and encouragement", color: "red" },
      { text: "Careful adjustments", color: "green" },
      { text: "Creative rethinking", color: "blue" },
    ],
  },
  {
    id: 35,
    section: "Adaptability & Innovation",
    question: "I stay motivated when…",
    options: [
      { text: "Work is progressing quickly", color: "yellow" },
      { text: "People around me are energized", color: "red" },
      { text: "Processes are clear", color: "green" },
      { text: "New ideas are flowing", color: "blue" },
    ],
  },
  {
    id: 36,
    section: "Adaptability & Innovation",
    question: "When testing new methods, I…",
    options: [
      { text: "Jump in quickly to try them", color: "yellow" },
      { text: "Build excitement for them", color: "red" },
      { text: "Research carefully first", color: "green" },
      { text: "Experiment boldly", color: "blue" },
    ],
  },
  {
    id: 37,
    section: "Adaptability & Innovation",
    question: "My team thrives when…",
    options: [
      { text: "Execution is strong", color: "yellow" },
      { text: "Motivation is high", color: "red" },
      { text: "Systems are clear", color: "green" },
      { text: "Creativity is encouraged", color: "blue" },
    ],
  },
  {
    id: 38,
    section: "Adaptability & Innovation",
    question: "If plans fall apart, I…",
    options: [
      { text: "Move to a backup quickly", color: "yellow" },
      { text: "Encourage others to stay positive", color: "red" },
      { text: "Rebuild logically", color: "green" },
      { text: "Pivot into a new idea", color: "blue" },
    ],
  },
  {
    id: 39,
    section: "Adaptability & Innovation",
    question: "My favorite type of work is…",
    options: [
      { text: "Task execution", color: "yellow" },
      { text: "Mission-driven teamwork", color: "red" },
      { text: "Structured, process-oriented work", color: "green" },
      { text: "Creative, experimental projects", color: "blue" },
    ],
  },
  {
    id: 40,
    section: "Adaptability & Innovation",
    question: "I thrive when I can…",
    options: [
      { text: "Push things into action", color: "yellow" },
      { text: "Motivate and uplift others", color: "red" },
      { text: "Create order and systems", color: "green" },
      { text: "Imagine new solutions", color: "blue" },
    ],
  },
  // Section E: Self-Awareness & Reflection (Q41–Q50)
  {
    id: 41,
    section: "Self-Awareness & Reflection",
    question: "My biggest management strength is…",
    options: [
      { text: "Execution", color: "yellow" },
      { text: "Inspiration", color: "red" },
      { text: "Organization", color: "green" },
      { text: "Creativity", color: "blue" },
    ],
  },
  {
    id: 42,
    section: "Self-Awareness & Reflection",
    question: "I get frustrated most when…",
    options: [
      { text: "Progress stalls", color: "yellow" },
      { text: "Energy is missing", color: "red" },
      { text: "Processes break down", color: "green" },
      { text: "Ideas are rejected", color: "blue" },
    ],
  },
  {
    id: 43,
    section: "Self-Awareness & Reflection",
    question: "I measure my growth by…",
    options: [
      { text: "What I've achieved", color: "yellow" },
      { text: "Who I've inspired", color: "red" },
      { text: "What systems I've built", color: "green" },
      { text: "What I've created", color: "blue" },
    ],
  },
  {
    id: 44,
    section: "Self-Awareness & Reflection",
    question: "My team notices that I…",
    options: [
      { text: "Act decisively", color: "yellow" },
      { text: "Inspire with passion", color: "red" },
      { text: "Keep things orderly", color: "green" },
      { text: "Share new ideas", color: "blue" },
    ],
  },
  {
    id: 45,
    section: "Self-Awareness & Reflection",
    question: "My proudest moments come when…",
    options: [
      { text: "Results are achieved fast", color: "yellow" },
      { text: "People feel uplifted", color: "red" },
      { text: "Processes run smoothly", color: "green" },
      { text: "Innovations succeed", color: "blue" },
    ],
  },
  {
    id: 46,
    section: "Self-Awareness & Reflection",
    question: "The hardest thing for me is…",
    options: [
      { text: "Waiting without acting", color: "yellow" },
      { text: "Leading without energy", color: "red" },
      { text: "Operating without structure", color: "green" },
      { text: "Being stuck in routine", color: "blue" },
    ],
  },
  {
    id: 47,
    section: "Self-Awareness & Reflection",
    question: "My natural leadership style is…",
    options: [
      { text: "Action-driven", color: "yellow" },
      { text: "Motivational", color: "red" },
      { text: "Strategic and structured", color: "green" },
      { text: "Creative and visionary", color: "blue" },
    ],
  },
  {
    id: 48,
    section: "Self-Awareness & Reflection",
    question: "I gain energy from…",
    options: [
      { text: "Achieving results", color: "yellow" },
      { text: "Inspiring others", color: "red" },
      { text: "Organizing complex problems", color: "green" },
      { text: "Imagining new futures", color: "blue" },
    ],
  },
  {
    id: 49,
    section: "Self-Awareness & Reflection",
    question: "My preferred role in management is…",
    options: [
      { text: "The driver", color: "yellow" },
      { text: "The motivator", color: "red" },
      { text: "The organizer", color: "green" },
      { text: "The innovator", color: "blue" },
    ],
  },
  {
    id: 50,
    section: "Self-Awareness & Reflection",
    question: "Ultimately, I want to be remembered as…",
    options: [
      { text: "A manager who got results", color: "yellow" },
      { text: "A manager who inspired people", color: "red" },
      { text: "A manager who built systems", color: "green" },
      { text: "A manager who sparked innovation", color: "blue" },
    ],
  },
];
