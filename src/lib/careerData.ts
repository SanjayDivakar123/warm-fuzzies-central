// Career recommendations for each RoleColor type

export interface CareerRecommendation {
  title: string;
  description: string;
  salaryRange: string;
  fitPercentage: number;
  skills: string[];
}

export interface ColorCareerProfile {
  colorName: string;
  emoji: string;
  archetype: string;
  tagline: string;
  description: string;
  coreStrengths: string[];
  careers: CareerRecommendation[];
  workEnvironment: string;
  leadershipStyle: string;
}

export const careerProfiles: Record<string, ColorCareerProfile> = {
  Yellow: {
    colorName: "Yellow",
    emoji: "🟡",
    archetype: "Executor",
    tagline: "The Results-Driven Achiever",
    description: "You're a natural executor who thrives on getting things done. Your action-oriented approach and determination make you ideal for roles requiring quick decision-making and measurable outcomes.",
    coreStrengths: [
      "Results-focused execution",
      "Quick decision-making",
      "High performance under pressure",
      "Goal achievement",
      "Efficient task management"
    ],
    careers: [
      {
        title: "Operations Manager",
        description: "Optimize processes and drive operational excellence across organizations",
        salaryRange: "$80k - $150k",
        fitPercentage: 95,
        skills: ["Process Optimization", "Team Leadership", "KPI Management", "Problem Solving"]
      },
      {
        title: "Engineering Lead",
        description: "Lead technical teams to deliver projects on time and to specification",
        salaryRange: "$120k - $200k",
        fitPercentage: 92,
        skills: ["Technical Leadership", "Project Delivery", "System Design", "Team Coordination"]
      },
      {
        title: "Emergency Response Director",
        description: "Coordinate rapid response teams and manage crisis situations",
        salaryRange: "$70k - $120k",
        fitPercentage: 90,
        skills: ["Crisis Management", "Quick Decision-Making", "Team Coordination", "Risk Assessment"]
      },
      {
        title: "Military Officer",
        description: "Lead military units with discipline, strategy, and decisive action",
        salaryRange: "$60k - $150k",
        fitPercentage: 88,
        skills: ["Strategic Planning", "Leadership", "Discipline", "Tactical Execution"]
      },
      {
        title: "Project Manager",
        description: "Drive project completion with efficiency and precision",
        salaryRange: "$75k - $140k",
        fitPercentage: 87,
        skills: ["Project Planning", "Resource Management", "Timeline Control", "Stakeholder Communication"]
      },
      {
        title: "Supply Chain Manager",
        description: "Ensure efficient flow of goods and optimize logistics operations",
        salaryRange: "$85k - $140k",
        fitPercentage: 85,
        skills: ["Logistics", "Vendor Management", "Cost Optimization", "Process Improvement"]
      },
      {
        title: "Construction Manager",
        description: "Oversee construction projects from planning to completion",
        salaryRange: "$90k - $160k",
        fitPercentage: 84,
        skills: ["Site Management", "Budget Control", "Safety Compliance", "Team Leadership"]
      },
      {
        title: "Plant Manager",
        description: "Direct manufacturing operations and maximize facility productivity",
        salaryRange: "$100k - $180k",
        fitPercentage: 83,
        skills: ["Manufacturing Operations", "Quality Control", "Safety Management", "Efficiency Optimization"]
      }
    ],
    workEnvironment: "Fast-paced, goal-oriented settings with clear metrics and tangible deliverables",
    leadershipStyle: "Direct, results-focused, and action-oriented with a bias toward execution"
  },
  Red: {
    colorName: "Red",
    emoji: "🔴",
    archetype: "Motivator",
    tagline: "The Charismatic Influencer",
    description: "You're a natural motivator who inspires others through passion and charisma. Your ability to connect with people and cast compelling visions makes you perfect for roles requiring influence and persuasion.",
    coreStrengths: [
      "Inspirational leadership",
      "Persuasive communication",
      "Relationship building",
      "Vision casting",
      "Team energizing"
    ],
    careers: [
      {
        title: "Sales Director",
        description: "Lead sales teams and drive revenue through inspiring leadership",
        salaryRange: "$120k - $250k+",
        fitPercentage: 95,
        skills: ["Sales Strategy", "Team Motivation", "Client Relations", "Revenue Growth"]
      },
      {
        title: "Founder / Entrepreneur",
        description: "Build and lead your own venture with passion and vision",
        salaryRange: "$0 - $1M+",
        fitPercentage: 94,
        skills: ["Vision Casting", "Risk Taking", "Business Development", "Inspiring Teams"]
      },
      {
        title: "Political Leader",
        description: "Influence policy and lead constituents through compelling communication",
        salaryRange: "$80k - $400k",
        fitPercentage: 92,
        skills: ["Public Speaking", "Policy Development", "Coalition Building", "Persuasion"]
      },
      {
        title: "Executive Coach",
        description: "Transform leaders through motivation and personalized guidance",
        salaryRange: "$100k - $300k",
        fitPercentage: 90,
        skills: ["Executive Development", "Active Listening", "Goal Setting", "Accountability"]
      },
      {
        title: "Media Personality",
        description: "Engage audiences through charisma and compelling storytelling",
        salaryRange: "$60k - $500k+",
        fitPercentage: 88,
        skills: ["On-Camera Presence", "Storytelling", "Audience Engagement", "Brand Building"]
      },
      {
        title: "Brand Director",
        description: "Shape brand identity and inspire marketing teams",
        salaryRange: "$100k - $180k",
        fitPercentage: 86,
        skills: ["Brand Strategy", "Creative Direction", "Team Leadership", "Campaign Development"]
      },
      {
        title: "Motivational Speaker",
        description: "Inspire audiences through powerful presentations and personal stories",
        salaryRange: "$50k - $250k+",
        fitPercentage: 85,
        skills: ["Public Speaking", "Storytelling", "Audience Connection", "Content Development"]
      },
      {
        title: "Recruiter / Talent Acquisition Lead",
        description: "Attract top talent through compelling employer branding and persuasion",
        salaryRange: "$70k - $150k",
        fitPercentage: 84,
        skills: ["Talent Sourcing", "Interviewing", "Relationship Building", "Employer Branding"]
      }
    ],
    workEnvironment: "Dynamic, people-focused settings with opportunities for public engagement and influence",
    leadershipStyle: "Inspirational, relationship-driven, and vision-focused with emphasis on motivation"
  },
  Green: {
    colorName: "Green",
    emoji: "🟢",
    archetype: "Strategist",
    tagline: "The Analytical Problem-Solver",
    description: "You're a strategic thinker who excels at analyzing complex problems and building systems. Your logical approach and attention to detail make you ideal for roles requiring precision and long-term planning.",
    coreStrengths: [
      "Strategic analysis",
      "Systematic thinking",
      "Data-driven decisions",
      "Process optimization",
      "Quality assurance"
    ],
    careers: [
      {
        title: "Chief Technology Officer",
        description: "Lead technology strategy and drive innovation across the organization",
        salaryRange: "$200k - $400k+",
        fitPercentage: 95,
        skills: ["Technology Strategy", "System Architecture", "Team Leadership", "Innovation"]
      },
      {
        title: "Data Scientist",
        description: "Extract insights from complex data to drive business decisions",
        salaryRange: "$100k - $180k",
        fitPercentage: 93,
        skills: ["Data Analysis", "Machine Learning", "Statistical Modeling", "Problem Solving"]
      },
      {
        title: "Financial Analyst",
        description: "Analyze financial data and provide strategic investment recommendations",
        salaryRange: "$80k - $150k",
        fitPercentage: 91,
        skills: ["Financial Modeling", "Risk Analysis", "Market Research", "Forecasting"]
      },
      {
        title: "Systems Architect",
        description: "Design scalable systems and technical infrastructure",
        salaryRange: "$140k - $220k",
        fitPercentage: 90,
        skills: ["Architecture Design", "Technical Planning", "Integration Strategy", "Documentation"]
      },
      {
        title: "Management Consultant",
        description: "Solve complex business problems through strategic analysis",
        salaryRange: "$100k - $250k",
        fitPercentage: 88,
        skills: ["Strategic Analysis", "Client Management", "Problem Solving", "Presentation"]
      },
      {
        title: "Quality Assurance Director",
        description: "Ensure products meet the highest standards of quality and reliability",
        salaryRange: "$110k - $170k",
        fitPercentage: 86,
        skills: ["Quality Systems", "Process Design", "Compliance", "Team Leadership"]
      },
      {
        title: "Research Scientist",
        description: "Conduct systematic research to advance knowledge and technology",
        salaryRange: "$90k - $160k",
        fitPercentage: 85,
        skills: ["Research Methodology", "Data Analysis", "Scientific Writing", "Critical Thinking"]
      },
      {
        title: "Chief Strategy Officer",
        description: "Define organizational strategy and long-term planning",
        salaryRange: "$180k - $350k",
        fitPercentage: 84,
        skills: ["Strategic Planning", "Market Analysis", "Business Development", "Executive Leadership"]
      }
    ],
    workEnvironment: "Structured, analytical settings with emphasis on data, precision, and systematic approaches",
    leadershipStyle: "Thoughtful, data-driven, and methodical with focus on long-term planning"
  },
  Blue: {
    colorName: "Blue",
    emoji: "🔵",
    archetype: "Connector",
    tagline: "The Empathetic Collaborator",
    description: "You're a natural connector who builds strong relationships and fosters collaboration. Your empathy and emotional intelligence make you perfect for roles requiring team building and interpersonal skills.",
    coreStrengths: [
      "Emotional intelligence",
      "Team building",
      "Conflict resolution",
      "Active listening",
      "Cultural development"
    ],
    careers: [
      {
        title: "Human Resources Director",
        description: "Shape organizational culture and develop people strategies",
        salaryRange: "$100k - $180k",
        fitPercentage: 95,
        skills: ["People Strategy", "Employee Relations", "Culture Building", "Talent Development"]
      },
      {
        title: "Therapist / Counselor",
        description: "Help individuals navigate challenges through empathetic guidance",
        salaryRange: "$60k - $120k",
        fitPercentage: 94,
        skills: ["Active Listening", "Emotional Support", "Assessment", "Treatment Planning"]
      },
      {
        title: "Chief People Officer",
        description: "Lead comprehensive people strategy and organizational development",
        salaryRange: "$180k - $350k",
        fitPercentage: 93,
        skills: ["Executive Leadership", "Culture Transformation", "Talent Strategy", "Change Management"]
      },
      {
        title: "Training & Development Manager",
        description: "Design and deliver programs to develop team capabilities",
        salaryRange: "$80k - $140k",
        fitPercentage: 91,
        skills: ["Program Design", "Facilitation", "Learning Technology", "Needs Assessment"]
      },
      {
        title: "Social Worker",
        description: "Support individuals and families through challenging life situations",
        salaryRange: "$50k - $80k",
        fitPercentage: 89,
        skills: ["Case Management", "Crisis Intervention", "Resource Coordination", "Advocacy"]
      },
      {
        title: "Customer Success Manager",
        description: "Build lasting relationships and ensure customer satisfaction",
        salaryRange: "$70k - $130k",
        fitPercentage: 87,
        skills: ["Relationship Building", "Problem Solving", "Account Management", "Communication"]
      },
      {
        title: "Nonprofit Director",
        description: "Lead mission-driven organizations focused on community impact",
        salaryRange: "$80k - $150k",
        fitPercentage: 86,
        skills: ["Mission Leadership", "Fundraising", "Community Relations", "Team Development"]
      },
      {
        title: "Team Facilitator / Mediator",
        description: "Guide groups to consensus and resolve interpersonal conflicts",
        salaryRange: "$70k - $120k",
        fitPercentage: 85,
        skills: ["Facilitation", "Mediation", "Negotiation", "Group Dynamics"]
      }
    ],
    workEnvironment: "Collaborative, supportive settings with emphasis on relationships and team harmony",
    leadershipStyle: "Empathetic, inclusive, and relationship-focused with emphasis on team wellbeing"
  }
};

// Map color names to their career profile (handle different formats)
export function getCareerProfile(color: string): ColorCareerProfile | null {
  const normalizedColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
  return careerProfiles[normalizedColor] || null;
}

// Get color emoji
export function getColorEmoji(color: string): string {
  const profile = getCareerProfile(color);
  return profile?.emoji || "⚪";
}
