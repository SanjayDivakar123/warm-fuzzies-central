import jsPDF from "jspdf";

// Color profile data for comprehensive analysis
const COLOR_PROFILES = {
  yellow: {
    name: "Yellow",
    title: "Action-Oriented Executor",
    subtitle: "The Results Driver",
    overview: "Yellow leaders are the engines of execution. They thrive on momentum, decisiveness, and tangible outcomes. When a Yellow sees a goal, they immediately begin calculating the fastest path to achievement. They are not paralyzed by analysis—they act. This makes them invaluable in high-pressure environments where speed and decisiveness are essential.",
    coreStrengths: [
      "Rapid decision-making under pressure",
      "Exceptional goal achievement and follow-through",
      "Natural ability to prioritize effectively",
      "Strong execution discipline",
      "Results-oriented mindset that drives productivity"
    ],
    stressBehaviors: [
      "May become impatient with slower-paced team members",
      "Can appear dismissive of process when focused on outcomes",
      "Tendency to take over tasks rather than delegate",
      "May sacrifice relationship-building for efficiency",
      "Can become frustrated when progress stalls"
    ],
    misinterpretations: [
      "Often mistaken for being uncaring (they care deeply about results)",
      "Perceived as controlling when they're actually trying to help",
      "Seen as impatient when they're simply action-oriented",
      "Viewed as dismissive when focused on priorities",
      "Misread as cold when being efficient"
    ],
    growthEdges: [
      "Developing patience with collaborative processes",
      "Learning to value the journey, not just the destination",
      "Building stronger emotional connections with team members",
      "Embracing strategic pauses for reflection",
      "Cultivating appreciation for diverse working styles"
    ],
    languageResponds: [
      "\"What's the fastest way to get this done?\"",
      "\"Let's set clear targets and metrics\"",
      "\"What are the action items?\"",
      "\"Let's eliminate the bottlenecks\"",
      "\"Show me the results\""
    ],
    leadershipStyle: "Yellow leaders lead from the front. They set the pace, establish clear expectations, and hold themselves and others accountable for results. Their leadership is characterized by clarity of direction, efficient use of resources, and an unwavering focus on achievement. They inspire through action and results rather than words.",
    inTeams: "In team settings, Yellows naturally gravitate toward project management and execution roles. They keep meetings on track, ensure deadlines are met, and hold the team accountable. They excel at breaking down large goals into actionable steps and tracking progress. However, they may need to consciously slow down to include quieter team members.",
    inConflict: "Yellows approach conflict directly and seek rapid resolution. They prefer to address issues head-on rather than let them fester. Their conflict style is solution-focused: identify the problem, determine the fix, implement, move on. They may need to develop more patience for processing emotions during conflict.",
    inLeadership: "As formal leaders, Yellows excel at setting direction, maintaining momentum, and achieving organizational goals. They are often promoted quickly due to their visible results. Their challenge is learning to inspire and develop others, not just drive them.",
    inLearning: "Yellows learn best through practical application. They prefer hands-on experiences, case studies with clear outcomes, and training that can be immediately applied. Theoretical discussions frustrate them unless connected to actionable takeaways.",
    inHighStakes: "High-pressure situations are where Yellows shine brightest. Their decisiveness and action-orientation make them invaluable in crisis situations. They remain calm, focused, and solution-oriented when others may freeze.",
    withOpposites: "Yellows work best with Blues (creative thinkers) when they value the Blue's innovative ideas and the Blue appreciates the Yellow's execution ability. The Yellow-Green pairing can be powerful when the Green provides systems and the Yellow drives implementation.",
    needsFromOthers: [
      "Clear communication without excessive preamble",
      "Respect for their time and efficiency",
      "Follow-through on commitments",
      "Autonomy to execute once direction is set",
      "Recognition for results achieved"
    ],
    othersNeedFromThem: [
      "Patience during collaborative processes",
      "Recognition of effort, not just outcomes",
      "Space for creative exploration",
      "Acknowledgment of different working styles",
      "Celebration of progress, not just completion"
    ],
    developmentStrategies: [
      "Practice active listening without immediately jumping to solutions",
      "Schedule regular one-on-ones focused on relationship building",
      "Celebrate process milestones, not just final results",
      "Seek feedback on your pace and its impact on others",
      "Develop mentoring relationships to build patience"
    ],
    doList: [
      "Set clear, measurable goals for yourself and your team",
      "Break large projects into daily actionable steps",
      "Communicate your priorities clearly and often",
      "Build in regular check-ins to ensure alignment",
      "Recognize and reward team members' contributions"
    ],
    dontList: [
      "Don't dismiss ideas without giving them fair consideration",
      "Don't sacrifice relationships for short-term efficiency",
      "Don't take over tasks from capable team members",
      "Don't skip the planning phase to start executing",
      "Don't ignore the emotional needs of your team"
    ],
    habitsToBuilding: [
      "Daily reflection on team dynamics and relationships",
      "Weekly one-on-ones focused on listening, not directing",
      "Monthly celebration of team achievements",
      "Quarterly strategic pauses for big-picture thinking",
      "Annual leadership development focused on emotional intelligence"
    ],
    reflectionQuestions: [
      "When was the last time I slowed down to really listen to a team member?",
      "How might my pace be affecting others around me?",
      "What would happen if I took more time for strategic thinking?",
      "Who on my team might benefit from more recognition?",
      "How can I better balance results with relationships?"
    ]
  },
  red: {
    name: "Red",
    title: "Inspirational Motivator",
    subtitle: "The Energy Catalyst",
    overview: "Red leaders are the spark that ignites teams. They possess an extraordinary ability to communicate vision, generate enthusiasm, and inspire others to action. When a Red enters a room, energy levels rise. They see possibilities where others see obstacles and have a unique gift for helping others believe in themselves and the mission.",
    coreStrengths: [
      "Exceptional communication and presentation skills",
      "Natural ability to inspire and motivate others",
      "Strong vision-casting and storytelling abilities",
      "Genuine enthusiasm that's contagious",
      "Ability to build emotional connections quickly"
    ],
    stressBehaviors: [
      "May become overly optimistic, ignoring realistic constraints",
      "Can struggle with follow-through on details",
      "Tendency to commit to too many initiatives",
      "May appear scattered when juggling multiple visions",
      "Can become emotionally reactive under pressure"
    ],
    misinterpretations: [
      "Often seen as 'all talk' when they're genuinely passionate",
      "Perceived as superficial when they're actually deeply caring",
      "Viewed as unrealistic when offering optimistic perspectives",
      "Seen as attention-seeking when sharing enthusiasm",
      "Misread as lacking depth when being engaging"
    ],
    growthEdges: [
      "Developing stronger follow-through systems",
      "Learning to balance vision with practical planning",
      "Building discipline for detail-oriented work",
      "Cultivating patience for slower-paced processes",
      "Strengthening active listening skills"
    ],
    languageResponds: [
      "\"I love your energy on this!\"",
      "\"You're the perfect person to lead this\"",
      "\"Let's brainstorm big ideas\"",
      "\"Your enthusiasm is contagious\"",
      "\"Help me see the vision\""
    ],
    leadershipStyle: "Red leaders lead through inspiration and connection. They paint compelling pictures of the future that make others want to follow. Their leadership is characterized by warmth, enthusiasm, and an ability to bring diverse people together around a common cause. They inspire loyalty through genuine care and shared excitement.",
    inTeams: "In team settings, Reds naturally energize and unite the group. They excel at kickoff meetings, brainstorming sessions, and moments when morale needs boosting. They're often the ones who remember birthdays, celebrate wins, and keep the team spirit high. Their challenge is staying engaged through the less exciting execution phases.",
    inConflict: "Reds prefer to resolve conflict through dialogue and relationship repair. They seek to understand emotions first and solutions second. Their conflict style is empathetic: acknowledge feelings, restore connection, then address the issue. They may need to develop more comfort with direct confrontation.",
    inLeadership: "As formal leaders, Reds excel at casting vision, building culture, and inspiring teams through change. They create environments where people feel valued and excited about the work. Their challenge is building systems and processes that ensure consistent execution.",
    inLearning: "Reds learn best through interaction, discussion, and storytelling. They prefer collaborative learning environments, group projects, and opportunities to share ideas. They retain information best when connected to emotional or relational context.",
    inHighStakes: "In high-pressure situations, Reds excel at rallying teams and maintaining morale. Their optimism can be a powerful antidote to fear and uncertainty. However, they may need grounding from more analytical team members to ensure realistic planning.",
    withOpposites: "Reds work well with Greens when the Green provides structure and the Red provides energy and buy-in. The Red-Yellow pairing can be powerful when the Red inspires and the Yellow executes, though both need to respect each other's pace.",
    needsFromOthers: [
      "Recognition and appreciation for their contributions",
      "Opportunities to share ideas and enthusiasm",
      "Support with details and follow-through",
      "Flexibility in how goals are achieved",
      "Collaborative rather than isolated work"
    ],
    othersNeedFromThem: [
      "Follow-through on commitments made",
      "Attention to important details",
      "Realistic assessment of timelines",
      "Active listening without immediate idea generation",
      "Acknowledgment when others need quiet focus"
    ],
    developmentStrategies: [
      "Create detailed action plans for each inspiring idea",
      "Partner with detail-oriented colleagues for accountability",
      "Practice pausing before committing to new initiatives",
      "Develop a personal system for tracking commitments",
      "Build in regular check-ins on project details"
    ],
    doList: [
      "Share your vision and enthusiasm regularly",
      "Connect personally with each team member",
      "Celebrate wins publicly and frequently",
      "Create collaborative spaces for idea generation",
      "Use storytelling to communicate key messages"
    ],
    dontList: [
      "Don't overpromise in moments of enthusiasm",
      "Don't ignore important details or logistics",
      "Don't dismiss analytical or critical feedback",
      "Don't dominate conversations with your energy",
      "Don't neglect follow-through on commitments"
    ],
    habitsToBuilding: [
      "Daily review of commitments and action items",
      "Weekly detailed planning sessions",
      "Monthly check-ins on project completion rates",
      "Quarterly reflection on promises kept vs. made",
      "Annual strategic planning with detailed milestones"
    ],
    reflectionQuestions: [
      "Which commitments have I made recently that need follow-through?",
      "How can I better balance my enthusiasm with realistic planning?",
      "Who might appreciate more listening and less advice from me?",
      "What details am I currently overlooking that matter to others?",
      "How can I channel my energy more sustainably?"
    ]
  },
  green: {
    name: "Green",
    title: "Analytical Systems Thinker",
    subtitle: "The Strategic Architect",
    overview: "Green leaders are the architects of sustainable success. They see patterns, build systems, and create structures that stand the test of time. When a Green analyzes a situation, they consider all variables, anticipate challenges, and design solutions that are both elegant and effective. They bring order to chaos and quality to quantity.",
    coreStrengths: [
      "Exceptional analytical and strategic thinking",
      "Natural ability to create efficient systems and processes",
      "Strong attention to detail and quality assurance",
      "Data-driven decision making",
      "Ability to anticipate problems before they occur"
    ],
    stressBehaviors: [
      "May become paralyzed by analysis, delaying decisions",
      "Can appear overly critical or perfectionistic",
      "Tendency to withdraw when overwhelmed with data",
      "May resist changes to established systems",
      "Can become frustrated with 'good enough' solutions"
    ],
    misinterpretations: [
      "Often seen as cold when they're being objective",
      "Perceived as slow when they're being thorough",
      "Viewed as negative when offering critical analysis",
      "Seen as rigid when maintaining quality standards",
      "Misread as unemotional when being professional"
    ],
    growthEdges: [
      "Learning to act with imperfect information",
      "Developing comfort with ambiguity and change",
      "Building stronger emotional connections",
      "Embracing 'good enough' when appropriate",
      "Communicating analysis in accessible ways"
    ],
    languageResponds: [
      "\"What does the data tell us?\"",
      "\"Let's think this through systematically\"",
      "\"What are the potential risks?\"",
      "\"Help me understand the logic\"",
      "\"Let's create a process for this\""
    ],
    leadershipStyle: "Green leaders lead through expertise, logic, and quality. They establish high standards, create efficient processes, and make decisions based on evidence. Their leadership is characterized by thoroughness, reliability, and a commitment to excellence. They inspire trust through competence and consistency.",
    inTeams: "In team settings, Greens naturally gravitate toward quality control, process improvement, and strategic planning roles. They ask the hard questions, identify potential problems, and ensure the team doesn't overlook critical details. Their challenge is balancing their need for perfection with team momentum.",
    inConflict: "Greens approach conflict analytically, seeking to understand root causes before proposing solutions. Their conflict style is logical: gather facts, analyze the situation, identify systemic issues, implement structural fixes. They may need to develop more attention to emotional aspects of conflict.",
    inLeadership: "As formal leaders, Greens excel at building efficient organizations, establishing quality standards, and making sound strategic decisions. They create environments of intellectual rigor and continuous improvement. Their challenge is inspiring and motivating teams beyond logical arguments.",
    inLearning: "Greens learn best through structured, logical presentations of information. They prefer detailed documentation, clear frameworks, and opportunities for deep analysis. They retain information best when they understand the underlying logic and can organize it systematically.",
    inHighStakes: "In high-pressure situations, Greens provide crucial analytical perspective. Their ability to remain objective and consider multiple variables helps teams avoid costly mistakes. However, they may need to accelerate their decision-making process in true emergencies.",
    withOpposites: "Greens work well with Reds when the Red provides energy and buy-in while the Green provides structure and quality control. The Green-Yellow pairing can be powerful when the Green designs systems and the Yellow drives execution.",
    needsFromOthers: [
      "Time to analyze and think before responding",
      "Respect for their need for accuracy and quality",
      "Clear, logical communication",
      "Appreciation for their attention to detail",
      "Patience with their thorough approach"
    ],
    othersNeedFromThem: [
      "Faster decision-making when appropriate",
      "More accessible communication of complex ideas",
      "Flexibility when 'good enough' is acceptable",
      "Recognition of emotional and relational factors",
      "Encouragement and positive feedback"
    ],
    developmentStrategies: [
      "Practice making decisions with 80% information",
      "Build in regular social interactions with team members",
      "Develop comfort with presenting imperfect ideas",
      "Learn to recognize when analysis delays action",
      "Create personal guidelines for 'good enough' standards"
    ],
    doList: [
      "Create clear systems and processes for your team",
      "Share your analytical insights in accessible ways",
      "Establish quality standards with clear criteria",
      "Anticipate and address potential problems proactively",
      "Document best practices for organizational learning"
    ],
    dontList: [
      "Don't let perfect be the enemy of good",
      "Don't dismiss emotional or intuitive input",
      "Don't overwhelm others with data and analysis",
      "Don't delay decisions indefinitely for more data",
      "Don't forget to celebrate wins and progress"
    ],
    habitsToBuilding: [
      "Daily connection with team members beyond work topics",
      "Weekly time-boxed decision-making exercises",
      "Monthly reflection on analysis-to-action ratio",
      "Quarterly review of communication effectiveness",
      "Annual assessment of work-life balance and relationships"
    ],
    reflectionQuestions: [
      "When has my need for perfection delayed important progress?",
      "How can I communicate my insights more accessibly?",
      "Who on my team might appreciate more personal connection?",
      "What decisions am I avoiding due to incomplete data?",
      "How can I better balance quality with momentum?"
    ]
  },
  blue: {
    name: "Blue",
    title: "Creative Innovator",
    subtitle: "The Possibility Explorer",
    overview: "Blue leaders are the visionaries who see what could be. They possess an extraordinary ability to imagine futures that don't yet exist and inspire others to help create them. When a Blue approaches a problem, they see opportunities for innovation. They question assumptions, challenge conventions, and find creative solutions that others overlook.",
    coreStrengths: [
      "Exceptional creativity and innovative thinking",
      "Natural ability to see possibilities and opportunities",
      "Strong big-picture and strategic vision",
      "Comfort with ambiguity and change",
      "Ability to connect disparate ideas in novel ways"
    ],
    stressBehaviors: [
      "May become scattered across too many ideas",
      "Can struggle with practical implementation details",
      "Tendency to lose interest once the creative phase ends",
      "May resist structure and constraints",
      "Can become frustrated with repetitive or routine work"
    ],
    misinterpretations: [
      "Often seen as unrealistic when they're being visionary",
      "Perceived as unfocused when exploring possibilities",
      "Viewed as impractical when offering creative solutions",
      "Seen as resistant when questioning constraints",
      "Misread as uncommitted when seeking novelty"
    ],
    growthEdges: [
      "Developing stronger execution and follow-through",
      "Learning to work within necessary constraints",
      "Building appreciation for routine and consistency",
      "Cultivating patience for incremental progress",
      "Strengthening attention to practical details"
    ],
    languageResponds: [
      "\"What if we tried something completely different?\"",
      "\"There are no bad ideas right now\"",
      "\"Let's reimagine this from scratch\"",
      "\"I want your creative perspective\"",
      "\"Think bigger—what's possible?\""
    ],
    leadershipStyle: "Blue leaders lead through vision and innovation. They challenge the status quo, inspire creative thinking, and create space for experimentation. Their leadership is characterized by openness, curiosity, and a willingness to take calculated risks. They inspire by showing others what's possible.",
    inTeams: "In team settings, Blues naturally gravitate toward innovation, brainstorming, and strategic visioning roles. They ask 'what if?' questions, challenge assumptions, and push the team to think beyond obvious solutions. Their challenge is staying engaged through implementation phases.",
    inConflict: "Blues approach conflict creatively, often reframing problems to find unexpected solutions. Their conflict style is innovative: look for third options, question underlying assumptions, find win-win possibilities. They may need to develop more appreciation for addressing conflicts directly.",
    inLeadership: "As formal leaders, Blues excel at driving innovation, leading change, and creating cultures of creativity. They build environments where experimentation is encouraged and failure is viewed as learning. Their challenge is building operational excellence and consistency.",
    inLearning: "Blues learn best through exploration, experimentation, and creative application. They prefer open-ended projects, opportunities for innovation, and freedom to approach problems their own way. They retain information best when they can make it their own.",
    inHighStakes: "In high-pressure situations, Blues bring creative problem-solving and the ability to see options others miss. Their comfort with ambiguity helps teams navigate unprecedented challenges. However, they may need support from more structured team members for implementation.",
    withOpposites: "Blues work well with Yellows when the Blue innovates and the Yellow executes. The Blue-Green pairing can be powerful when the Blue provides creative vision and the Green ensures practical viability.",
    needsFromOthers: [
      "Freedom to explore and innovate",
      "Appreciation for their creative contributions",
      "Flexibility in how goals are achieved",
      "Support with implementation details",
      "Patience with their non-linear thinking"
    ],
    othersNeedFromThem: [
      "Follow-through on creative ideas",
      "Attention to practical constraints",
      "Respect for established processes when appropriate",
      "Focus on current priorities before new ideas",
      "Clear communication of creative concepts"
    ],
    developmentStrategies: [
      "Partner with execution-oriented colleagues",
      "Create systems for capturing and prioritizing ideas",
      "Practice finishing projects before starting new ones",
      "Develop appreciation for the value of routine",
      "Build in checkpoints to ensure implementation"
    ],
    doList: [
      "Share your creative vision with enthusiasm",
      "Challenge assumptions constructively",
      "Create space for team innovation and experimentation",
      "Connect creative ideas to strategic goals",
      "Celebrate creative risks, even when they don't succeed"
    ],
    dontList: [
      "Don't abandon ideas before implementation",
      "Don't dismiss practical constraints entirely",
      "Don't overwhelm teams with too many new ideas",
      "Don't neglect routine responsibilities for creative pursuits",
      "Don't invalidate others' need for structure"
    ],
    habitsToBuilding: [
      "Daily review of current commitments before new ideas",
      "Weekly focused implementation sessions",
      "Monthly project completion celebrations",
      "Quarterly review of ideas generated vs. implemented",
      "Annual strategic planning with concrete milestones"
    ],
    reflectionQuestions: [
      "Which creative projects need my attention to completion?",
      "How can I better balance innovation with execution?",
      "Who might help me implement my best ideas?",
      "What practical constraints am I currently ignoring?",
      "How can I channel my creativity more sustainably?"
    ]
  }
};

interface Professional50QResults {
  dominantColor: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  scores: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
  totalQuestions: number;
  participantName?: string;
  organization?: string;
  assessmentDate?: string;
}

const getColorHex = (color: string): [number, number, number] => {
  const colors: Record<string, [number, number, number]> = {
    yellow: [234, 179, 8],
    red: [220, 38, 38],
    green: [22, 163, 74],
    blue: [37, 99, 235]
  };
  return colors[color] || colors.blue;
};

const getSecondaryColorHex = (color: string): [number, number, number] => {
  const colors: Record<string, [number, number, number]> = {
    yellow: [251, 191, 36],
    red: [239, 68, 68],
    green: [34, 197, 94],
    blue: [59, 130, 246]
  };
  return colors[color] || colors.blue;
};

const getLightColorHex = (color: string): [number, number, number] => {
  const colors: Record<string, [number, number, number]> = {
    yellow: [254, 249, 195],
    red: [254, 226, 226],
    green: [220, 252, 231],
    blue: [219, 234, 254]
  };
  return colors[color] || colors.blue;
};

export const exportProfessional50QPDF = async (results: Professional50QResults): Promise<boolean> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const primaryColor = getColorHex(results.dominantColor);
  const secondaryColor = getSecondaryColorHex(results.dominantColor);
  const lightColor = getLightColorHex(results.dominantColor);
  
  const sortedScores = Object.entries(results.scores)
    .sort(([, a], [, b]) => b - a);
  
  const dominantColor = sortedScores[0][0];
  const secondaryColorName = sortedScores[1][0];
  const tertiaryColorName = sortedScores[2][0];
  
  const profile = COLOR_PROFILES[dominantColor as keyof typeof COLOR_PROFILES];
  const secondaryProfile = COLOR_PROFILES[secondaryColorName as keyof typeof COLOR_PROFILES];
  const tertiaryProfile = COLOR_PROFILES[tertiaryColorName as keyof typeof COLOR_PROFILES];
  
  // Helper function to add footer
  const addFooter = (pageNum: number, totalPages: number) => {
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(8);
    pdf.text('Role Color Finder™ Professional Leadership Assessment', 20, pageHeight - 7);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 7);
    pdf.text('Confidential', pageWidth / 2, pageHeight - 7, { align: 'center' });
  };
  
  // Helper function to add section header
  const addSectionHeader = (title: string, y: number): number => {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, y, pageWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title.toUpperCase(), 20, y + 8);
    return y + 20;
  };
  
  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number): string[] => {
    return pdf.splitTextToSize(text, maxWidth);
  };
  
  let pageNumber = 1;
  const totalPages = 28; // Approximate
  
  // ==================== FRONT MATTER ====================
  
  // PAGE 1: Cover Page
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('ROLE COLOR FINDER™', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROFESSIONAL', pageWidth / 2, 70, { align: 'center' });
  pdf.text('LEADERSHIP', pageWidth / 2, 85, { align: 'center' });
  pdf.text('PROFILE', pageWidth / 2, 100, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('50-Question Comprehensive Assessment', pageWidth / 2, 120, { align: 'center' });
  
  // Participant info box
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(30, 150, pageWidth - 60, 50, 3, 3, 'F');
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PARTICIPANT', 40, 165);
  pdf.setFont('helvetica', 'normal');
  pdf.text(results.participantName || 'Assessment Participant', 40, 175);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('ORGANIZATION', 120, 165);
  pdf.setFont('helvetica', 'normal');
  pdf.text(results.organization || 'Professional Assessment', 120, 175);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATE', 40, 190);
  pdf.setFont('helvetica', 'normal');
  pdf.text(results.assessmentDate || new Date().toLocaleDateString(), 40, 200);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONFIDENTIAL LEADERSHIP PROFILE', pageWidth / 2, 230, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This report contains sensitive assessment data.', pageWidth / 2, 245, { align: 'center' });
  pdf.text('Handle with appropriate confidentiality.', pageWidth / 2, 252, { align: 'center' });
  
  addFooter(pageNumber++, totalPages);
  
  // PAGE 2: Founder's Letter
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  let y = addSectionHeader('A Letter from the Founders', 15);
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const founderLetter = `Dear Leader,

Thank you for completing the Role Color Finder Professional Assessment. What you hold in your hands is not a personality test, a horoscope, or a static label that defines you forever. It is a mirror—a tool for understanding how you naturally show up in the world and how you can intentionally grow.

WHY THIS EXISTS

We created this assessment because we observed a persistent problem in organizations: leaders being misaligned with their natural strengths, mislabeled based on superficial observations, and underutilized because their unique value wasn't understood. The cost of this misalignment is enormous—in lost productivity, failed initiatives, and human potential that never gets realized.

WHAT PROBLEM IT SOLVES

This assessment helps solve three critical challenges:

• Misalignment: Leaders working against their natural grain, exhausting themselves and underperforming
• Mislabeling: Colleagues and managers misunderstanding what drives certain behaviors
• Underutilization: Organizations failing to leverage the full spectrum of leadership styles

WHAT THIS IS NOT

This is not a test with right or wrong answers. There is no "best" color to be. Each leadership style has unique strengths that organizations need. The goal is not to change who you are, but to understand yourself more deeply so you can lead more effectively.

This report is a snapshot of your current tendencies—not a permanent classification. You will grow, adapt, and develop new capabilities throughout your career. Use this as a starting point for reflection and intentional development.

We hope this assessment serves you well on your leadership journey.

With respect for your growth,
The Role Color Finder Team`;

  const letterLines = wrapText(founderLetter, pageWidth - 40);
  letterLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5.5));
  });
  
  addFooter(pageNumber++, totalPages);
  
  // PAGE 3: How to Read This Report
  pdf.addPage();
  y = addSectionHeader('How to Read This Report', 15);
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  const sections = [
    {
      title: 'Executive Summary (Pages 5-6)',
      description: 'If you only read one section, read this. It distills your entire profile into key insights and action items.'
    },
    {
      title: 'Core Profile Expansion (Pages 7-18)',
      description: 'Deep dive into your primary, secondary, and tertiary leadership colors. Understand your strengths, stress behaviors, growth edges, and leadership style.'
    },
    {
      title: 'Application Contexts (Pages 19-26)',
      description: 'How your leadership style manifests in specific situations: teams, conflict, high-stakes environments, and collaboration with other styles.'
    },
    {
      title: 'Action & Development (Pages 27-32)',
      description: 'Personalized strategies, habits to build, reflection questions, and a 30-day alignment plan to apply your insights.'
    }
  ];
  
  sections.forEach((section) => {
    pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    pdf.rect(20, y - 4, pageWidth - 40, 18, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(section.title, 25, y + 2);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const descLines = wrapText(section.description, pageWidth - 50);
    descLines.forEach((line, i) => {
      pdf.text(line, 25, y + 9 + (i * 4));
    });
    
    y += 25;
  });
  
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('FOR LEADERS, TEACHERS, OR MANAGERS:', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  const usageText = `• Use the Core Profile to understand your direct reports' natural tendencies
• Reference Application Contexts when navigating specific situations
• Share relevant sections with team members to improve collaboration
• Return to the Action Plan quarterly to assess growth`;
  
  const usageLines = wrapText(usageText, pageWidth - 40);
  usageLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += 30;
  pdf.setFillColor(254, 226, 226);
  pdf.rect(20, y, pageWidth - 40, 35, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(180, 0, 0);
  pdf.text('HOW NOT TO MISUSE THIS REPORT:', 25, y + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const misuse = `• Don't use colors to limit what someone can do ("You're a Green, so you can't lead")
• Don't use this to excuse poor behavior ("That's just how Reds are")
• Don't hire or fire based solely on color profiles
• Don't share someone's profile without their consent`;
  
  const misuseLines = wrapText(misuse, pageWidth - 50);
  misuseLines.forEach((line, i) => {
    pdf.text(line, 25, y + 15 + (i * 5));
  });
  
  addFooter(pageNumber++, totalPages);
  
  // PAGE 4: Scientific Foundations
  pdf.addPage();
  y = addSectionHeader('Scientific & Conceptual Foundations', 15);
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const scienceIntro = `The Role Color Finder assessment is grounded in established psychological research and organizational behavior theory. While we've created a unique framework, our approach builds on decades of validated research.`;
  
  const scienceLines = wrapText(scienceIntro, pageWidth - 40);
  scienceLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += 20;
  
  const foundations = [
    {
      title: 'Color Psychology',
      content: 'Colors have been used as psychological symbols across cultures for millennia. Our framework draws on research showing that color associations reflect deep behavioral patterns. Yellow represents action and energy, Red represents passion and connection, Green represents analysis and structure, Blue represents creativity and vision.'
    },
    {
      title: 'Role Theory',
      content: 'Building on the work of sociologists like Erving Goffman and psychologists like Philip Zimbardo, we recognize that individuals naturally gravitate toward certain roles in group settings. These preferences are relatively stable but can be consciously developed.'
    },
    {
      title: 'Behavioral Preference Research',
      content: 'Our assessment methodology is informed by behavioral assessment research, including studies on leadership styles, team dynamics, and individual differences in work preferences. We measure behavioral tendencies, not fixed traits.'
    },
    {
      title: 'Situational Leadership',
      content: 'We acknowledge that effective leadership requires adapting to context. Your dominant color represents your natural preference, but great leaders learn to flex across all four styles as situations demand.'
    }
  ];
  
  foundations.forEach((foundation) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(foundation.title, 20, y);
    
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const contentLines = wrapText(foundation.content, pageWidth - 40);
    contentLines.forEach((line, i) => {
      pdf.text(line, 20, y + (i * 4.5));
    });
    
    y += contentLines.length * 4.5 + 8;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // PAGE 5-6: Executive Summary
  pdf.addPage();
  y = addSectionHeader('Executive Summary', 15);
  
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.roundedRect(20, y, pageWidth - 40, 40, 3, 3, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text('IF YOU ONLY READ ONE SECTION, READ THIS', pageWidth / 2, y + 10, { align: 'center' });
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`You are a ${profile.title}`, pageWidth / 2, y + 28, { align: 'center' });
  
  y += 50;
  
  // Score breakdown
  pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  pdf.rect(20, y, pageWidth - 40, 50, 'F');
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YOUR COLOR DISTRIBUTION', 25, y + 10);
  
  let scoreY = y + 20;
  sortedScores.forEach(([color, score]) => {
    const percentage = Math.round((score / results.totalQuestions) * 100);
    const colorHex = getColorHex(color);
    
    pdf.setFillColor(colorHex[0], colorHex[1], colorHex[2]);
    pdf.rect(25, scoreY - 2, 8, 8, 'F');
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${color.charAt(0).toUpperCase() + color.slice(1)}:`, 38, scoreY + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${percentage}%`, 65, scoreY + 4);
    
    // Progress bar
    pdf.setFillColor(220, 220, 220);
    pdf.rect(85, scoreY, 80, 6, 'F');
    pdf.setFillColor(colorHex[0], colorHex[1], colorHex[2]);
    pdf.rect(85, scoreY, 80 * (percentage / 100), 6, 'F');
    
    scoreY += 10;
  });
  
  y += 60;
  
  // Key insights
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('KEY INSIGHTS', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  const overviewLines = wrapText(profile.overview, pageWidth - 40);
  overviewLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += overviewLines.length * 5 + 10;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('YOUR TOP STRENGTHS:', 20, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  
  profile.coreStrengths.slice(0, 3).forEach((strength) => {
    pdf.text(`• ${strength}`, 25, y);
    y += 5;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Continue Executive Summary
  pdf.addPage();
  y = 25;
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXECUTIVE SUMMARY (continued)', 20, y);
  
  y += 15;
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YOUR GROWTH EDGES', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  profile.growthEdges.slice(0, 3).forEach((edge) => {
    pdf.text(`• ${edge}`, 25, y);
    y += 5;
  });
  
  y += 10;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('YOUR LEADERSHIP STYLE IN ACTION', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  const styleLines = wrapText(profile.leadershipStyle, pageWidth - 40);
  styleLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += styleLines.length * 5 + 15;
  
  // Quick action items
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(20, y, pageWidth - 40, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IMMEDIATE ACTION ITEMS', 25, y + 6);
  
  y += 15;
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  profile.doList.slice(0, 3).forEach((item, i) => {
    pdf.text(`${i + 1}. ${item}`, 25, y);
    y += 6;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // ==================== CORE PROFILE EXPANSION ====================
  
  // PAGE 7-12: Primary Role Deep Dive
  pdf.addPage();
  
  // Primary color header
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text('YOUR PRIMARY LEADERSHIP COLOR', 20, 20);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(profile.title, 20, 40);
  
  y = 60;
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(14);
  pdf.text(profile.subtitle, 20, y);
  
  y += 15;
  
  // Role Overview
  pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  pdf.rect(20, y - 5, pageWidth - 40, 40, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('ROLE OVERVIEW', 25, y + 2);
  
  y += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  
  const overviewText = wrapText(profile.overview, pageWidth - 50);
  overviewText.forEach((line, i) => {
    pdf.text(line, 25, y + (i * 4.5));
  });
  
  y += overviewText.length * 4.5 + 15;
  
  // Core Strengths
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('CORE STRENGTHS (Situational, Not Generic)', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  
  profile.coreStrengths.forEach((strength) => {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.circle(25, y + 1.5, 1.5, 'F');
    pdf.text(strength, 30, y + 3);
    y += 7;
  });
  
  y += 10;
  
  // Stress Behaviors
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('STRESS BEHAVIORS (What Happens Under Pressure)', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  profile.stressBehaviors.forEach((behavior) => {
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.circle(25, y + 1.5, 1.5, 'F');
    pdf.text(behavior, 30, y + 3);
    y += 7;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Page 8: Misinterpretations & Growth Edges
  pdf.addPage();
  y = 25;
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${profile.name.toUpperCase()} - PRIMARY ROLE (continued)`, 20, y);
  
  y += 15;
  
  // Misinterpretations
  pdf.setFontSize(11);
  pdf.text('MISINTERPRETATIONS (How Others Often Misunderstand This Role)', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  
  profile.misinterpretations.forEach((item) => {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.circle(25, y + 1.5, 1.5, 'F');
    pdf.text(item, 30, y + 3);
    y += 7;
  });
  
  y += 12;
  
  // Growth Edges
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('GROWTH EDGES (What This Role Must Consciously Develop)', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  profile.growthEdges.forEach((edge) => {
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.circle(25, y + 1.5, 1.5, 'F');
    pdf.text(edge, 30, y + 3);
    y += 7;
  });
  
  y += 12;
  
  // Language This Role Responds To
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('LANGUAGE THIS ROLE RESPONDS TO', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(60, 60, 60);
  
  profile.languageResponds.forEach((phrase) => {
    pdf.text(phrase, 25, y);
    y += 6;
  });
  
  y += 12;
  
  // Leadership Style in Action
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('LEADERSHIP STYLE IN ACTION', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  const leadershipLines = wrapText(profile.leadershipStyle, pageWidth - 40);
  leadershipLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Pages 9-10: Secondary Role
  pdf.addPage();
  
  const secondaryColorHex = getColorHex(secondaryColorName);
  const secondaryLightColor = getLightColorHex(secondaryColorName);
  
  pdf.setFillColor(secondaryColorHex[0], secondaryColorHex[1], secondaryColorHex[2]);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text('YOUR SECONDARY LEADERSHIP COLOR', 20, 15);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(secondaryProfile.title, 20, 32);
  
  y = 50;
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const secOverviewLines = wrapText(secondaryProfile.overview, pageWidth - 40);
  secOverviewLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 4.5));
  });
  
  y += secOverviewLines.length * 4.5 + 10;
  
  // Secondary Strengths
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(secondaryColorHex[0], secondaryColorHex[1], secondaryColorHex[2]);
  pdf.text('KEY STRENGTHS', 20, y);
  
  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  secondaryProfile.coreStrengths.slice(0, 3).forEach((strength) => {
    pdf.text(`• ${strength}`, 25, y);
    y += 5;
  });
  
  y += 8;
  
  // Secondary Growth Edges
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(secondaryColorHex[0], secondaryColorHex[1], secondaryColorHex[2]);
  pdf.text('GROWTH EDGES', 20, y);
  
  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  secondaryProfile.growthEdges.slice(0, 3).forEach((edge) => {
    pdf.text(`• ${edge}`, 25, y);
    y += 5;
  });
  
  y += 8;
  
  // How Secondary Complements Primary
  pdf.setFillColor(secondaryLightColor[0], secondaryLightColor[1], secondaryLightColor[2]);
  pdf.rect(20, y, pageWidth - 40, 30, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(secondaryColorHex[0], secondaryColorHex[1], secondaryColorHex[2]);
  pdf.text('HOW THIS COMPLEMENTS YOUR PRIMARY COLOR', 25, y + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(9);
  
  const complementText = `Your ${secondaryProfile.name} tendencies provide balance to your primary ${profile.name} style. When your ${profile.name} approach isn't working, you can draw on your ${secondaryProfile.name} capabilities to adapt.`;
  const compLines = wrapText(complementText, pageWidth - 50);
  compLines.forEach((line, i) => {
    pdf.text(line, 25, y + 15 + (i * 4));
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Page 11: Tertiary Role
  pdf.addPage();
  
  const tertiaryColorHex = getColorHex(tertiaryColorName);
  
  pdf.setFillColor(tertiaryColorHex[0], tertiaryColorHex[1], tertiaryColorHex[2]);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text('YOUR TERTIARY LEADERSHIP COLOR', 20, 12);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(tertiaryProfile.title, 20, 28);
  
  y = 45;
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const tertOverviewLines = wrapText(tertiaryProfile.overview.substring(0, 300) + '...', pageWidth - 40);
  tertOverviewLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 4.5));
  });
  
  y += tertOverviewLines.length * 4.5 + 10;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(tertiaryColorHex[0], tertiaryColorHex[1], tertiaryColorHex[2]);
  pdf.text('KEY STRENGTHS TO DEVELOP', 20, y);
  
  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  tertiaryProfile.coreStrengths.slice(0, 3).forEach((strength) => {
    pdf.text(`• ${strength}`, 25, y);
    y += 5;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // ==================== APPLICATION CONTEXTS ====================
  
  // Page 12-18: Application Contexts
  pdf.addPage();
  y = addSectionHeader('Application Contexts', 15);
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('How your leadership style manifests in specific situations', 20, y);
  
  y += 12;
  
  // In Teams
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.text('IN TEAMS', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  const teamLines = wrapText(profile.inTeams, pageWidth - 40);
  teamLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += teamLines.length * 5 + 12;
  
  // In Conflict
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.text('IN CONFLICT', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  const conflictLines = wrapText(profile.inConflict, pageWidth - 40);
  conflictLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += conflictLines.length * 5 + 12;
  
  // In Leadership
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.text('IN LEADERSHIP', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  const leaderLines = wrapText(profile.inLeadership, pageWidth - 40);
  leaderLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Page 13: More Contexts
  pdf.addPage();
  y = 25;
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('APPLICATION CONTEXTS (continued)', 20, y);
  
  y += 15;
  
  // In Learning
  pdf.setFontSize(12);
  pdf.text('IN LEARNING ENVIRONMENTS', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  const learnLines = wrapText(profile.inLearning, pageWidth - 40);
  learnLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += learnLines.length * 5 + 12;
  
  // In High Stakes
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.text('IN HIGH-STAKES SITUATIONS', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  const stakeLines = wrapText(profile.inHighStakes, pageWidth - 40);
  stakeLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  y += stakeLines.length * 5 + 12;
  
  // With Opposite Roles
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.text('IN COLLABORATION WITH OPPOSITE ROLES', 20, y);
  
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  const oppLines = wrapText(profile.withOpposites, pageWidth - 40);
  oppLines.forEach((line, i) => {
    pdf.text(line, 20, y + (i * 5));
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Page 14: What Role Needs / Others Need
  pdf.addPage();
  y = 25;
  
  // Two column layout
  const colWidth = (pageWidth - 50) / 2;
  
  // What This Role Needs From Others
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(20, y, colWidth, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WHAT YOU NEED FROM OTHERS', 25, y + 7);
  
  let leftY = y + 18;
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  profile.needsFromOthers.forEach((need) => {
    const needLines = wrapText(`• ${need}`, colWidth - 10);
    needLines.forEach((line, i) => {
      pdf.text(line, 25, leftY + (i * 4));
    });
    leftY += needLines.length * 4 + 2;
  });
  
  // What Others Need From This Role
  pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.rect(pageWidth / 2 + 5, y, colWidth, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WHAT OTHERS NEED FROM YOU', pageWidth / 2 + 10, y + 7);
  
  let rightY = y + 18;
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  profile.othersNeedFromThem.forEach((need) => {
    const needLines = wrapText(`• ${need}`, colWidth - 10);
    needLines.forEach((line, i) => {
      pdf.text(line, pageWidth / 2 + 10, rightY + (i * 4));
    });
    rightY += needLines.length * 4 + 2;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // ==================== ACTION & DEVELOPMENT ====================
  
  // Page 15-20: Action & Development
  pdf.addPage();
  y = addSectionHeader('Action & Development Plan', 15);
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Where the report stops being descriptive and becomes operational', 20, y);
  
  y += 15;
  
  // Development Strategies
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.text('PERSONALIZED DEVELOPMENT STRATEGIES', 20, y);
  
  y += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  profile.developmentStrategies.forEach((strategy, i) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${i + 1}.`, 20, y);
    pdf.setFont('helvetica', 'normal');
    const stratLines = wrapText(strategy, pageWidth - 50);
    stratLines.forEach((line, j) => {
      pdf.text(line, 30, y + (j * 5));
    });
    y += stratLines.length * 5 + 5;
  });
  
  y += 10;
  
  // Do List
  pdf.setFillColor(220, 252, 231);
  pdf.rect(20, y, (pageWidth - 50) / 2, 8, 'F');
  pdf.setTextColor(22, 163, 74);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DO', 25, y + 6);
  
  // Don't List
  pdf.setFillColor(254, 226, 226);
  pdf.rect(pageWidth / 2 + 5, y, (pageWidth - 50) / 2, 8, 'F');
  pdf.setTextColor(220, 38, 38);
  pdf.text("DON'T", pageWidth / 2 + 10, y + 6);
  
  y += 15;
  leftY = y;
  rightY = y;
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  profile.doList.forEach((item) => {
    const itemLines = wrapText(`✓ ${item}`, (pageWidth - 60) / 2);
    itemLines.forEach((line, i) => {
      pdf.text(line, 25, leftY + (i * 4));
    });
    leftY += itemLines.length * 4 + 2;
  });
  
  profile.dontList.forEach((item) => {
    const itemLines = wrapText(`✗ ${item}`, (pageWidth - 60) / 2);
    itemLines.forEach((line, i) => {
      pdf.text(line, pageWidth / 2 + 10, rightY + (i * 4));
    });
    rightY += itemLines.length * 4 + 2;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Page 16: Habits & Reflection
  pdf.addPage();
  y = 25;
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ACTION & DEVELOPMENT (continued)', 20, y);
  
  y += 15;
  
  // Role-Specific Habits
  pdf.setFontSize(12);
  pdf.text('ROLE-SPECIFIC HABITS TO BUILD', 20, y);
  
  y += 10;
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  profile.habitsToBuilding.forEach((habit) => {
    pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    pdf.rect(20, y - 3, pageWidth - 40, 8, 'F');
    pdf.text(`• ${habit}`, 25, y + 2);
    y += 10;
  });
  
  y += 10;
  
  // Reflection Questions
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(12);
  pdf.text('REFLECTION QUESTIONS', 20, y);
  
  y += 10;
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  
  profile.reflectionQuestions.forEach((question, i) => {
    pdf.text(`${i + 1}. ${question}`, 25, y);
    y += 7;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Page 17: 30-Day Alignment Plan
  pdf.addPage();
  y = addSectionHeader('30-Day Alignment Plan', 15);
  
  const weeks = [
    {
      title: 'WEEK 1: AWARENESS',
      tasks: [
        'Read your full profile report twice',
        'Share key insights with a trusted colleague',
        'Identify 3 situations where your primary color shows up',
        'Notice when stress behaviors emerge'
      ]
    },
    {
      title: 'WEEK 2: OBSERVATION',
      tasks: [
        'Track daily interactions through your color lens',
        'Identify colors of 5 key colleagues',
        'Notice friction points with opposite colors',
        'Journal about one growth edge daily'
      ]
    },
    {
      title: 'WEEK 3: EXPERIMENTATION',
      tasks: [
        'Try one behavior from your secondary color',
        'Practice the language that resonates with you',
        'Address one stress behavior intentionally',
        'Seek feedback from a colleague'
      ]
    },
    {
      title: 'WEEK 4: INTEGRATION',
      tasks: [
        'Create a personal development plan',
        'Schedule monthly check-ins on growth',
        'Identify an accountability partner',
        'Set 90-day development goals'
      ]
    }
  ];
  
  weeks.forEach((week) => {
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(20, y, pageWidth - 40, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(week.title, 25, y + 6);
    
    y += 12;
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    week.tasks.forEach((task) => {
      pdf.text(`□ ${task}`, 30, y);
      y += 5;
    });
    
    y += 8;
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Page 18: Support Guide
  pdf.addPage();
  y = 25;
  
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HOW MANAGERS/TEACHERS/PARENTS CAN SUPPORT THIS ROLE', 20, y);
  
  y += 15;
  
  const supportTips = [
    `Give ${profile.name}s clear expectations and autonomy to achieve them`,
    `Recognize their unique contributions regularly`,
    `Provide feedback that acknowledges their strengths first`,
    `Create space for them to leverage their natural tendencies`,
    `Be patient with their growth edges—they're aware and working on them`,
    `Connect development opportunities to their interests`,
    `Help them see how their role fits the bigger picture`
  ];
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  supportTips.forEach((tip, i) => {
    pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    pdf.rect(20, y - 3, pageWidth - 40, 10, 'F');
    pdf.text(`${i + 1}. ${tip}`, 25, y + 3);
    y += 12;
  });
  
  y += 15;
  
  // Forward-Looking Note
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(20, y, pageWidth - 40, 50, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('A FORWARD-LOOKING NOTE', 25, y + 12);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const forwardNote = `Your leadership color is not a box—it's a starting point. The most effective leaders learn to flex across all four colors while remaining grounded in their authentic strengths. Use this report not as a label, but as a lens for understanding yourself and others. Your growth journey is just beginning.`;
  
  const noteLines = wrapText(forwardNote, pageWidth - 50);
  noteLines.forEach((line, i) => {
    pdf.text(line, 25, y + 22 + (i * 5));
  });
  
  addFooter(pageNumber++, totalPages);
  
  // Final Page: Back Cover
  pdf.addPage();
  
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ROLE COLOR FINDER™', pageWidth / 2, 80, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Professional Leadership Assessment', pageWidth / 2, 95, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text('www.rolecolorfinder.com', pageWidth / 2, 140, { align: 'center' });
  pdf.text('info@rolecolorfinder.com', pageWidth / 2, 152, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`© ${new Date().getFullYear()} Role Color Finder. All rights reserved.`, pageWidth / 2, 200, { align: 'center' });
  pdf.text('This report is confidential and intended for the named recipient only.', pageWidth / 2, 210, { align: 'center' });
  
  // Save the PDF
  const participantSlug = (results.participantName || 'assessment').toLowerCase().replace(/\s+/g, '-');
  pdf.save(`leadership-profile-${participantSlug}-${new Date().toISOString().split('T')[0]}.pdf`);
  
  return true;
};
