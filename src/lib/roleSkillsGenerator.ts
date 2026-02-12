/**
 * Deterministic Skills Generator for Job Roles
 * 
 * Generates 8-12 skills based on role name using RoleColor framework.
 * No external API calls - uses template-based generation.
 */

// RoleColor skill categories mapped to skill types
const ROLECOLOR_SKILL_TEMPLATES: Record<string, string[]> = {
  // Yellow (Executor) - action-oriented, results-driven
  executor: [
    'Task Execution',
    'Deadline Management',
    'Results Orientation',
    'Efficiency Optimization',
    'Progress Tracking',
    'Resource Allocation',
    'Time Management',
    'Goal Achievement',
  ],
  // Red (Motivator) - inspiring, people-focused
  motivator: [
    'Team Leadership',
    'Stakeholder Communication',
    'Conflict Resolution',
    'Persuasion & Influence',
    'Relationship Building',
    'Coaching & Mentoring',
    'Public Speaking',
    'Team Motivation',
  ],
  // Green (Organizer) - structured, detail-oriented
  organizer: [
    'Process Documentation',
    'Quality Assurance',
    'Risk Management',
    'Compliance & Standards',
    'Data Analysis',
    'Project Planning',
    'Budget Management',
    'Attention to Detail',
  ],
  // Blue (Innovator) - creative, visionary
  innovator: [
    'Strategic Thinking',
    'Creative Problem Solving',
    'Innovation Design',
    'Trend Analysis',
    'Product Vision',
    'Research & Development',
    'Future Planning',
    'Design Thinking',
  ],
};

// Role name keywords that suggest RoleColor affinity
const ROLE_KEYWORD_MAPPING: Record<string, string[]> = {
  // Executor roles
  manager: ['executor', 'organizer'],
  engineer: ['executor', 'innovator'],
  developer: ['executor', 'innovator'],
  analyst: ['organizer', 'executor'],
  coordinator: ['organizer', 'executor'],
  administrator: ['organizer', 'executor'],
  operations: ['executor', 'organizer'],
  production: ['executor', 'organizer'],
  
  // Motivator roles
  sales: ['motivator', 'executor'],
  marketing: ['motivator', 'innovator'],
  hr: ['motivator', 'organizer'],
  human: ['motivator', 'organizer'],
  recruiter: ['motivator', 'organizer'],
  support: ['motivator', 'executor'],
  customer: ['motivator', 'executor'],
  account: ['motivator', 'organizer'],
  
  // Organizer roles
  finance: ['organizer', 'executor'],
  accountant: ['organizer', 'executor'],
  compliance: ['organizer', 'executor'],
  legal: ['organizer', 'executor'],
  quality: ['organizer', 'executor'],
  auditor: ['organizer', 'executor'],
  
  // Innovator roles
  designer: ['innovator', 'executor'],
  product: ['innovator', 'executor'],
  creative: ['innovator', 'motivator'],
  research: ['innovator', 'organizer'],
  strategist: ['innovator', 'organizer'],
  architect: ['innovator', 'organizer'],
  ux: ['innovator', 'executor'],
  ui: ['innovator', 'executor'],
  
  // Leadership roles (balanced)
  director: ['motivator', 'executor', 'organizer', 'innovator'],
  vp: ['motivator', 'innovator', 'executor'],
  chief: ['motivator', 'innovator', 'organizer'],
  ceo: ['motivator', 'innovator', 'executor'],
  cto: ['innovator', 'executor', 'organizer'],
  cfo: ['organizer', 'executor'],
  coo: ['executor', 'organizer'],
  head: ['motivator', 'executor', 'organizer'],
  lead: ['motivator', 'executor'],
  senior: ['executor', 'innovator'],
};

// Role-specific technical skills
const ROLE_TECHNICAL_SKILLS: Record<string, string[]> = {
  engineer: ['Software Development', 'Code Review', 'System Design', 'Testing & QA'],
  developer: ['Coding', 'Debugging', 'Version Control', 'API Development'],
  designer: ['Visual Design', 'Prototyping', 'User Research', 'Design Systems'],
  manager: ['Team Management', 'Performance Reviews', 'Resource Planning', 'Reporting'],
  analyst: ['Data Analysis', 'Report Writing', 'Requirements Gathering', 'Metrics Tracking'],
  marketing: ['Campaign Management', 'Content Creation', 'Analytics', 'Brand Strategy'],
  sales: ['Pipeline Management', 'Negotiation', 'Client Presentations', 'CRM Usage'],
  hr: ['Recruitment', 'Employee Relations', 'Policy Development', 'Onboarding'],
  finance: ['Financial Reporting', 'Budgeting', 'Forecasting', 'Compliance'],
  product: ['Roadmap Planning', 'User Stories', 'Market Research', 'Feature Prioritization'],
  support: ['Ticket Resolution', 'Customer Communication', 'Technical Troubleshooting', 'Documentation'],
};

export interface GeneratedRole {
  name: string;
  description: string;
  skills: string[];
  suggestedRoleColors: string[];
}

/**
 * Generate skills for a job role using deterministic template-based approach.
 * Returns 8-12 skills based on role name analysis.
 */
export function generateRoleSkills(roleName: string): GeneratedRole {
  const normalizedRole = roleName.toLowerCase().trim();
  const words = normalizedRole.split(/[\s\-_]+/);
  
  // Detect which RoleColors this role aligns with
  const detectedColors = new Set<string>();
  for (const word of words) {
    for (const [keyword, colors] of Object.entries(ROLE_KEYWORD_MAPPING)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        colors.forEach(c => detectedColors.add(c));
      }
    }
  }
  
  // Default to balanced if no specific colors detected
  if (detectedColors.size === 0) {
    detectedColors.add('executor');
    detectedColors.add('organizer');
  }
  
  // Collect skills from detected RoleColors
  const collectedSkills = new Set<string>();
  const roleColors = Array.from(detectedColors);
  
  // Add RoleColor-based skills (2-3 from each detected color)
  for (const color of roleColors) {
    const colorSkills = ROLECOLOR_SKILL_TEMPLATES[color] || [];
    const selected = colorSkills.slice(0, Math.min(3, colorSkills.length));
    selected.forEach(s => collectedSkills.add(s));
  }
  
  // Add role-specific technical skills
  for (const word of words) {
    for (const [keyword, skills] of Object.entries(ROLE_TECHNICAL_SKILLS)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        const selected = skills.slice(0, 3);
        selected.forEach(s => collectedSkills.add(s));
      }
    }
  }
  
  // Ensure we have 8-12 skills
  let finalSkills = Array.from(collectedSkills);
  
  // If too few, add more from detected colors
  while (finalSkills.length < 8) {
    for (const color of roleColors) {
      const colorSkills = ROLECOLOR_SKILL_TEMPLATES[color] || [];
      for (const skill of colorSkills) {
        if (!finalSkills.includes(skill)) {
          finalSkills.push(skill);
          if (finalSkills.length >= 8) break;
        }
      }
      if (finalSkills.length >= 8) break;
    }
    // Safety break to prevent infinite loop
    if (finalSkills.length < 8) {
      finalSkills.push('Problem Solving', 'Communication', 'Adaptability', 'Collaboration');
      break;
    }
  }
  
  // Limit to 12 skills
  finalSkills = finalSkills.slice(0, 12);
  
  // Generate description
  const description = generateRoleDescription(roleName, roleColors);
  
  return {
    name: roleName,
    description,
    skills: finalSkills,
    suggestedRoleColors: roleColors,
  };
}

function generateRoleDescription(roleName: string, roleColors: string[]): string {
  const colorDescriptions: Record<string, string> = {
    executor: 'action-oriented and results-driven',
    motivator: 'people-focused with strong communication skills',
    organizer: 'detail-oriented with strong organizational abilities',
    innovator: 'creative and strategic in approach',
  };
  
  const traits = roleColors.map(c => colorDescriptions[c]).filter(Boolean);
  const traitText = traits.length > 1 
    ? `${traits.slice(0, -1).join(', ')}, and ${traits[traits.length - 1]}`
    : traits[0] || 'versatile and adaptable';
  
  return `This role is ${traitText}. Ideal candidates will excel in their core responsibilities while contributing to team success.`;
}

/**
 * Validate that generated skills are deterministic.
 * Same input should always produce same output.
 */
export function validateSkillsDeterminism(roleName: string): boolean {
  const result1 = generateRoleSkills(roleName);
  const result2 = generateRoleSkills(roleName);
  
  return (
    result1.skills.length === result2.skills.length &&
    result1.skills.every((skill, i) => skill === result2.skills[i]) &&
    result1.description === result2.description
  );
}

// Extended skill library for bulk generation (up to 50 skills)
const EXTENDED_SKILLS_LIBRARY: Record<string, string[]> = {
  // Core competencies
  core: [
    'Problem Solving', 'Critical Thinking', 'Decision Making', 'Communication', 
    'Collaboration', 'Adaptability', 'Time Management', 'Organization',
    'Attention to Detail', 'Initiative', 'Self-Motivation', 'Work Ethic',
    'Professionalism', 'Integrity', 'Accountability', 'Reliability',
  ],
  // Leadership skills
  leadership: [
    'Team Leadership', 'Strategic Planning', 'Vision Setting', 'Change Management',
    'Conflict Resolution', 'Mentoring', 'Coaching', 'Delegation',
    'Performance Management', 'Motivating Others', 'Decision Authority', 'Crisis Management',
    'Stakeholder Management', 'Executive Presence', 'Building Trust', 'Team Building',
  ],
  // Technical/analytical
  technical: [
    'Data Analysis', 'Technical Writing', 'Research Skills', 'Process Improvement',
    'Quality Assurance', 'Project Management', 'Budget Management', 'Risk Assessment',
    'Documentation', 'Reporting', 'Metrics Tracking', 'Systems Thinking',
    'Root Cause Analysis', 'Benchmarking', 'Compliance', 'Auditing',
  ],
  // Interpersonal
  interpersonal: [
    'Active Listening', 'Empathy', 'Negotiation', 'Persuasion',
    'Presentation Skills', 'Public Speaking', 'Networking', 'Relationship Building',
    'Customer Service', 'Client Management', 'Vendor Relations', 'Cross-functional Collaboration',
    'Cultural Awareness', 'Emotional Intelligence', 'Feedback Delivery', 'Conflict Management',
  ],
  // Innovation & creativity
  innovation: [
    'Creative Thinking', 'Innovation', 'Design Thinking', 'Brainstorming',
    'Ideation', 'Prototyping', 'Experimentation', 'Trend Analysis',
    'Market Research', 'Competitive Analysis', 'Product Development', 'Future Planning',
    'Solution Design', 'User Experience Focus', 'Continuous Improvement', 'Agile Thinking',
  ],
  // Digital & modern
  digital: [
    'Digital Literacy', 'Software Proficiency', 'Data Visualization', 'Spreadsheet Analysis',
    'Presentation Software', 'Collaboration Tools', 'Project Management Tools', 'CRM Systems',
    'Remote Work Efficiency', 'Virtual Communication', 'Cloud Technologies', 'Automation Awareness',
    'Cybersecurity Awareness', 'AI & ML Understanding', 'Analytics Tools', 'Digital Marketing',
  ],
};

/**
 * Generate an extended list of skills for a role (up to maxSkills).
 * Uses the role name to determine relevant skill categories.
 */
export function generateExtendedSkills(roleName: string, maxSkills: number = 20): string[] {
  const normalizedRole = roleName.toLowerCase().trim();
  const words = normalizedRole.split(/[\s\-_]+/);
  
  // Start with base generated skills
  const baseResult = generateRoleSkills(roleName);
  const skills = new Set<string>(baseResult.skills);
  
  // Determine which extended categories are most relevant
  const categoryWeights: Record<string, number> = {
    core: 3, // Always relevant
    leadership: 0,
    technical: 0,
    interpersonal: 0,
    innovation: 0,
    digital: 1, // Somewhat relevant to all
  };
  
  // Weight categories based on role keywords
  const leadershipKeywords = ['manager', 'director', 'lead', 'head', 'chief', 'vp', 'executive', 'supervisor', 'ceo', 'cto', 'cfo'];
  const technicalKeywords = ['engineer', 'developer', 'analyst', 'scientist', 'architect', 'specialist', 'technician', 'admin', 'dba'];
  const interpersonalKeywords = ['sales', 'hr', 'support', 'customer', 'account', 'recruiter', 'relations', 'success', 'service'];
  const innovationKeywords = ['designer', 'creative', 'product', 'strategist', 'innovation', 'research', 'ux', 'ui'];
  
  for (const word of words) {
    if (leadershipKeywords.some(k => word.includes(k))) categoryWeights.leadership += 3;
    if (technicalKeywords.some(k => word.includes(k))) categoryWeights.technical += 3;
    if (interpersonalKeywords.some(k => word.includes(k))) categoryWeights.interpersonal += 3;
    if (innovationKeywords.some(k => word.includes(k))) categoryWeights.innovation += 3;
  }
  
  // Sort categories by weight
  const sortedCategories = Object.entries(categoryWeights)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
  
  // Add skills from categories in order of relevance
  let categoryIndex = 0;
  let skillIndex = 0;
  
  while (skills.size < maxSkills && categoryIndex < sortedCategories.length) {
    const category = sortedCategories[categoryIndex];
    const categorySkills = EXTENDED_SKILLS_LIBRARY[category] || [];
    
    if (skillIndex < categorySkills.length) {
      const skill = categorySkills[skillIndex];
      if (!skills.has(skill)) {
        skills.add(skill);
      }
      skillIndex++;
    } else {
      categoryIndex++;
      skillIndex = 0;
    }
    
    // Cycle through categories to get variety
    if (skillIndex > 0 && skillIndex % 4 === 0) {
      categoryIndex = (categoryIndex + 1) % sortedCategories.length;
      if (categoryIndex === 0) skillIndex += 4; // Move to next batch
    }
  }
  
  return Array.from(skills).slice(0, maxSkills);
}
