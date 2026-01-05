export type ColorType = "Yellow" | "Red" | "Green" | "Blue";

export interface GameChoice {
  text: string;
  color: ColorType;
  outcome: string;
}

export interface GameScenario {
  id: number;
  chapter: string;
  title: string;
  narrative: string;
  situation: string;
  choices: GameChoice[];
}

export const leadershipGameScenarios: GameScenario[] = [
  // Chapter 1: The New Team (Forming Stage)
  {
    id: 1,
    chapter: "Chapter 1: The New Team",
    title: "First Day as Leader",
    narrative: "You've just been appointed to lead a new cross-functional team. The team members don't know each other well, and there's an air of uncertainty in the room.",
    situation: "Everyone is looking at you expectantly. How do you begin this first meeting?",
    choices: [
      { text: "Break the ice with a fun team-building activity and share personal stories", color: "Yellow", outcome: "The room lights up with laughter. People start relaxing and sharing." },
      { text: "Set clear goals, roles, and expectations right away to establish structure", color: "Red", outcome: "The team nods seriously. They now know exactly what's expected." },
      { text: "Go around the room letting everyone introduce themselves at their own pace", color: "Green", outcome: "A calm atmosphere develops. People feel safe to open up gradually." },
      { text: "Present data on the project scope and ask for analytical input", color: "Blue", outcome: "Technical discussions begin. The team starts problem-solving together." }
    ]
  },
  {
    id: 2,
    chapter: "Chapter 1: The New Team",
    title: "The Quiet One",
    narrative: "You notice one team member, Alex, hasn't spoken much during meetings. Others are dominating conversations.",
    situation: "Alex seems to have good ideas but holds back. What's your approach?",
    choices: [
      { text: "Publicly encourage Alex in a warm, enthusiastic way to share thoughts", color: "Yellow", outcome: "Alex blushes but smiles, offering a surprisingly creative idea." },
      { text: "Directly ask Alex for their opinion on a specific decision", color: "Red", outcome: "Put on the spot, Alex delivers a concise, well-thought response." },
      { text: "Have a private one-on-one to understand Alex's comfort level", color: "Green", outcome: "Alex opens up about feeling overshadowed and appreciates your care." },
      { text: "Create an anonymous idea submission system for everyone", color: "Blue", outcome: "Alex submits detailed written proposals that impress the team." }
    ]
  },
  {
    id: 3,
    chapter: "Chapter 1: The New Team",
    title: "Resource Crunch",
    narrative: "Your team needs additional resources, but budget is tight. Other departments are competing for the same pool.",
    situation: "You have a meeting with leadership tomorrow to make your case. How do you prepare?",
    choices: [
      { text: "Create an inspiring vision presentation showing the team's potential impact", color: "Yellow", outcome: "Leadership gets excited about the possibilities you paint." },
      { text: "Prepare a bold, confident pitch demanding what your team needs to win", color: "Red", outcome: "Your assertiveness impresses them. They respect your conviction." },
      { text: "Build relationships with other department heads to find collaborative solutions", color: "Green", outcome: "You discover shared resources and create win-win partnerships." },
      { text: "Compile detailed ROI analysis and risk assessments to justify every dollar", color: "Blue", outcome: "Your thorough analysis makes the decision easy for leadership." }
    ]
  },
  // Chapter 2: Growing Pains (Storming Stage)
  {
    id: 4,
    chapter: "Chapter 2: Growing Pains",
    title: "The Disagreement",
    narrative: "Two of your strongest team members, Jordan and Sam, are in heated disagreement about the project direction.",
    situation: "Their conflict is affecting team morale. Others are taking sides. What do you do?",
    choices: [
      { text: "Bring everyone together for an open discussion, keeping the mood light", color: "Yellow", outcome: "Tensions ease as you help both sides see humor in the situation." },
      { text: "Make an executive decision to end the debate and move forward", color: "Red", outcome: "The decision is made. Some grumble, but progress resumes." },
      { text: "Mediate privately, listening to both perspectives without judgment", color: "Green", outcome: "Both feel heard. They find unexpected common ground." },
      { text: "Analyze both proposals objectively and present pros/cons to the team", color: "Blue", outcome: "Data-driven discussion replaces emotional arguments." }
    ]
  },
  {
    id: 5,
    chapter: "Chapter 2: Growing Pains",
    title: "Missed Deadline",
    narrative: "A critical milestone has been missed. The client is unhappy, and your manager is asking questions.",
    situation: "You need to address this with both your team and stakeholders. What's your priority?",
    choices: [
      { text: "Rally the team with optimism, focusing on what we can still achieve", color: "Yellow", outcome: "Energy returns. The team commits to an ambitious recovery plan." },
      { text: "Take immediate action: identify the bottleneck and fix it now", color: "Red", outcome: "You quickly pinpoint and remove the obstacle. Work accelerates." },
      { text: "Check in with team members individually to understand what went wrong", color: "Green", outcome: "You discover burnout and personal issues affecting performance." },
      { text: "Conduct a detailed root cause analysis before responding", color: "Blue", outcome: "Your systematic review reveals process flaws to fix permanently." }
    ]
  },
  {
    id: 6,
    chapter: "Chapter 2: Growing Pains",
    title: "The Underminer",
    narrative: "You've noticed that one team member, Casey, frequently makes subtle negative comments about your decisions to others.",
    situation: "It's affecting your authority and team cohesion. How do you handle Casey?",
    choices: [
      { text: "Address it with humor and openness in a team setting", color: "Yellow", outcome: "Your lighthearted approach diffuses tension. Casey backs off." },
      { text: "Confront Casey directly and privately, setting clear boundaries", color: "Red", outcome: "Casey respects your directness and commits to change behavior." },
      { text: "Try to understand Casey's perspective and build a better relationship", color: "Green", outcome: "You learn Casey felt overlooked. Addressing this transforms the dynamic." },
      { text: "Document incidents and address through proper HR channels", color: "Blue", outcome: "Your systematic approach creates a formal record and resolution path." }
    ]
  },
  // Chapter 3: Finding Our Rhythm (Norming Stage)
  {
    id: 7,
    chapter: "Chapter 3: Finding Our Rhythm",
    title: "Process Improvement",
    narrative: "The team is working well together now, but you see opportunities to improve efficiency.",
    situation: "You want to introduce new processes without disrupting the good momentum. How do you approach this?",
    choices: [
      { text: "Make it exciting - gamify the new process with friendly competitions", color: "Yellow", outcome: "The team loves it. Adoption is enthusiastic and fun." },
      { text: "Implement changes decisively with clear timelines and accountability", color: "Red", outcome: "Changes happen fast. The team adapts to new expectations." },
      { text: "Involve the team in designing the new processes collaboratively", color: "Green", outcome: "Buy-in is high because everyone contributed to the solution." },
      { text: "Pilot changes with data collection to prove effectiveness first", color: "Blue", outcome: "Evidence-based improvements gain easy acceptance." }
    ]
  },
  {
    id: 8,
    chapter: "Chapter 3: Finding Our Rhythm",
    title: "Star Performer",
    narrative: "One team member, Taylor, is significantly outperforming others. Some teammates are starting to resent this.",
    situation: "You want to recognize Taylor without alienating the rest of the team. What's your approach?",
    choices: [
      { text: "Celebrate Taylor publicly while highlighting everyone's unique contributions", color: "Yellow", outcome: "The recognition feels inclusive. Team spirit rises." },
      { text: "Promote Taylor to a lead role with additional responsibilities", color: "Red", outcome: "Taylor thrives with new challenges. Others see a path forward." },
      { text: "Have Taylor mentor struggling teammates, building team connections", color: "Green", outcome: "Knowledge sharing improves the whole team. Resentment fades." },
      { text: "Create objective metrics so everyone's contributions are measured fairly", color: "Blue", outcome: "Transparent measurement system clarifies everyone's value." }
    ]
  },
  {
    id: 9,
    chapter: "Chapter 3: Finding Our Rhythm",
    title: "Remote Challenge",
    narrative: "Some team members are now working remotely while others are in-office. Communication gaps are appearing.",
    situation: "The hybrid setup is creating an 'us vs them' dynamic. How do you bridge this gap?",
    choices: [
      { text: "Organize virtual social events and creative team bonding activities", color: "Yellow", outcome: "Fun activities reconnect everyone regardless of location." },
      { text: "Establish mandatory check-in times when everyone must be available", color: "Red", outcome: "Structure ensures everyone stays connected and accountable." },
      { text: "Create buddy pairs between remote and in-office workers", color: "Green", outcome: "Personal connections bridge the physical distance." },
      { text: "Implement comprehensive digital collaboration tools and documentation", color: "Blue", outcome: "Systematic communication removes information asymmetry." }
    ]
  },
  // Chapter 4: Peak Performance (Performing Stage)
  {
    id: 10,
    chapter: "Chapter 4: Peak Performance",
    title: "Big Opportunity",
    narrative: "Your team has been offered a high-profile project that could make or break careers. It's ambitious and risky.",
    situation: "The team is excited but nervous. How do you approach this opportunity?",
    choices: [
      { text: "Generate infectious enthusiasm about the possibilities and potential glory", color: "Yellow", outcome: "The team catches your vision and charges forward eagerly." },
      { text: "Accept the challenge confidently and push the team to rise to it", color: "Red", outcome: "Your bold leadership inspires the team to exceed their limits." },
      { text: "Discuss as a team whether we're ready, respecting everyone's concerns", color: "Green", outcome: "Consensus-building ensures everyone is committed to the journey." },
      { text: "Conduct thorough risk analysis and create detailed contingency plans", color: "Blue", outcome: "Preparation minimizes surprises. The team feels confident in the plan." }
    ]
  },
  {
    id: 11,
    chapter: "Chapter 4: Peak Performance",
    title: "Crisis Mode",
    narrative: "A major system failure threatens to derail the project. Clients are panicking. Your team is looking to you.",
    situation: "This is a true test of leadership under pressure. What's your immediate response?",
    choices: [
      { text: "Stay positive and keep everyone calm with reassurance and humor", color: "Yellow", outcome: "Your calm confidence prevents panic. Clear thinking prevails." },
      { text: "Take charge immediately, giving clear orders and leading from the front", color: "Red", outcome: "Your decisive action cuts through chaos. The team executes." },
      { text: "Ensure everyone's wellbeing first, then tackle the problem together", color: "Green", outcome: "The team feels supported. They work together harmoniously on the fix." },
      { text: "Systematically diagnose the root cause before taking any action", color: "Blue", outcome: "Your methodical approach identifies the real problem quickly." }
    ]
  },
  {
    id: 12,
    chapter: "Chapter 4: Peak Performance",
    title: "The Victory",
    narrative: "Against all odds, your team has delivered exceptional results. Leadership is impressed. How do you celebrate?",
    situation: "This is a moment to cement team culture and set up future success. What do you prioritize?",
    choices: [
      { text: "Throw an amazing celebration and publicly recognize everyone's contributions", color: "Yellow", outcome: "The party becomes legendary. Team bonds are forged for life." },
      { text: "Push for immediate rewards: bonuses, promotions, new opportunities", color: "Red", outcome: "Your advocacy gets tangible results for your team members." },
      { text: "Create meaningful personal recognition for each team member's unique contribution", color: "Green", outcome: "Everyone feels truly seen and valued as individuals." },
      { text: "Document lessons learned and best practices for future projects", color: "Blue", outcome: "Institutional knowledge is preserved. Future teams will benefit." }
    ]
  },
  // Chapter 5: Evolution (Transforming Stage)
  {
    id: 13,
    chapter: "Chapter 5: Evolution",
    title: "Team Changes",
    narrative: "Two key team members are leaving for other opportunities. The team dynamic will inevitably change.",
    situation: "You need to manage this transition while maintaining momentum. What's your focus?",
    choices: [
      { text: "Throw memorable send-offs and welcome new members with enthusiasm", color: "Yellow", outcome: "Transitions feel celebratory rather than sad. Culture continues." },
      { text: "Move quickly to fill gaps and maintain team performance standards", color: "Red", outcome: "No momentum is lost. The team keeps delivering at high levels." },
      { text: "Focus on emotional support for remaining team and smooth handoffs", color: "Green", outcome: "The team navigates change with resilience and connection intact." },
      { text: "Create detailed knowledge transfer documentation and onboarding plans", color: "Blue", outcome: "Critical knowledge is preserved. New members ramp up efficiently." }
    ]
  },
  {
    id: 14,
    chapter: "Chapter 5: Evolution",
    title: "Your Growth",
    narrative: "You've been offered a promotion that would take you away from this team you've built.",
    situation: "It's a great opportunity, but leaving this team feels difficult. How do you approach the decision?",
    choices: [
      { text: "Get excited about new possibilities and share your enthusiasm openly", color: "Yellow", outcome: "Your positivity makes the transition feel like a celebration." },
      { text: "Accept decisively and immediately start grooming your replacement", color: "Red", outcome: "Your clear action ensures smooth leadership succession." },
      { text: "Have heartfelt conversations with each team member about the change", color: "Green", outcome: "Deep relationships transcend organizational changes." },
      { text: "Create comprehensive handover documentation and transition plans", color: "Blue", outcome: "Your thorough preparation ensures nothing falls through cracks." }
    ]
  },
  {
    id: 15,
    chapter: "Chapter 5: Evolution",
    title: "Legacy",
    narrative: "As you prepare to move on, you reflect on what you want your leadership legacy to be.",
    situation: "What final message do you want to leave with your team?",
    choices: [
      { text: "Inspire them to dream big and never lose their creative spark", color: "Yellow", outcome: "Your optimism becomes part of the team's DNA forever." },
      { text: "Challenge them to keep pushing boundaries and achieving greatness", color: "Red", outcome: "Your drive for excellence continues to motivate long after you leave." },
      { text: "Remind them that relationships and supporting each other matter most", color: "Green", outcome: "The culture of care you built becomes the team's foundation." },
      { text: "Leave behind systems and processes that will guide future success", color: "Blue", outcome: "Your structured approach provides lasting frameworks for success." }
    ]
  }
];

// Calculate color scores from game choices (same logic as 50Q assessment)
export function calculateGameResults(choices: Record<number, ColorType>) {
  const colorCounts = { Yellow: 0, Red: 0, Green: 0, Blue: 0 };
  
  Object.values(choices).forEach(color => {
    colorCounts[color]++;
  });
  
  const totalAnswers = Object.keys(choices).length;
  const colorScores = {
    Yellow: Math.round((colorCounts.Yellow / totalAnswers) * 100),
    Red: Math.round((colorCounts.Red / totalAnswers) * 100),
    Green: Math.round((colorCounts.Green / totalAnswers) * 100),
    Blue: Math.round((colorCounts.Blue / totalAnswers) * 100),
  };
  
  const sortedColors = Object.entries(colorScores)
    .sort(([, a], [, b]) => b - a) as [ColorType, number][];
  
  const primaryColor = sortedColors[0][0];
  const secondaryColor = sortedColors[1][0];
  
  // Calculate spectrum position
  const primaryScore = colorScores[primaryColor];
  const secondaryScore = colorScores[secondaryColor];
  let spectrumPosition = 12.5;
  
  const totalPrimarySecondary = primaryScore + secondaryScore;
  if (totalPrimarySecondary > 0 && secondaryScore > primaryScore * 0.5) {
    const secondaryInfluence = (secondaryScore / totalPrimarySecondary) - 0.5;
    spectrumPosition += secondaryInfluence * 25;
  }
  spectrumPosition = Math.max(5, Math.min(30, Math.round(spectrumPosition)));
  
  // Category scores based on chapters (similar to 50Q categories)
  const categoryScores = {
    "Decision-Making": calculateChapterScore(choices, [1, 4, 10]),
    "Communication Style": calculateChapterScore(choices, [2, 5, 9]),
    "Team Dynamics": calculateChapterScore(choices, [4, 8, 13]),
    "Conflict Behavior": calculateChapterScore(choices, [4, 6, 11]),
    "Motivation Drivers": calculateChapterScore(choices, [3, 7, 10]),
    "Stress Behavior": calculateChapterScore(choices, [5, 11, 14]),
    "Collaboration": calculateChapterScore(choices, [2, 7, 9]),
    "Self-Management": calculateChapterScore(choices, [12, 14, 15]),
  };
  
  return {
    colorScores,
    primaryColor,
    secondaryColor,
    spectrumPosition,
    categoryScores,
  };
}

function calculateChapterScore(choices: Record<number, ColorType>, questionIds: number[]): number {
  const relevantChoices = questionIds
    .filter(id => choices[id])
    .map(id => choices[id]);
  
  if (relevantChoices.length === 0) return 0;
  
  const colorCounts = { Yellow: 0, Red: 0, Green: 0, Blue: 0 };
  relevantChoices.forEach(color => colorCounts[color]++);
  
  const maxCount = Math.max(...Object.values(colorCounts));
  return Math.round((maxCount / relevantChoices.length) * 100);
}
