export type RoleColor = 'Red' | 'Yellow' | 'Green' | 'Blue';
export type PairRisk = 'high' | 'medium' | 'low';

export interface CompanyMember {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  role: string;
  jobRole: string | null;
  departmentId: string | null;
  departmentName: string | null;
  roleColor: RoleColor | null;
}

export interface ClashPattern {
  key: string;
  name: string;
  risk: PairRisk;
  summary: string;
  why: string;
  strengths: string[];
  watchouts: string[];
  actions: string[];
}

export interface RelevantPair {
  id: string;
  key: string | null;
  a: CompanyMember;
  b: CompanyMember;
  clash: ClashPattern | null;
  risk: PairRisk;
  collabReason: string | null;
}

export interface PairDetail {
  title: string;
  summary: string;
  assessmentReady: boolean;
  strengths: string[];
  watchouts: string[];
  actions: string[];
}

interface RoleColorMeta {
  label: string;
  hex: string;
  tint: string;
  text: string;
  focus: string;
  contribution: string;
  blindSpot: string;
  preferredCadence: string;
}

export const ROLE_COLOR_META: Record<RoleColor, RoleColorMeta> = {
  Red: {
    label: 'Motivator',
    hex: '#E24B4A',
    tint: '#FCEBEB',
    text: '#A32D2D',
    focus: 'people momentum, alignment, and visible energy',
    contribution: 'social energy, urgency, and buy-in',
    blindSpot: 'optimism can outrun structure',
    preferredCadence: 'live discussion and fast relational feedback',
  },
  Yellow: {
    label: 'Executor',
    hex: '#EF9F27',
    tint: '#FAEEDA',
    text: '#854F0B',
    focus: 'clear priorities, ownership, and delivery',
    contribution: 'follow-through, sequencing, and accountability',
    blindSpot: 'speed can outrun context',
    preferredCadence: 'clear handoffs and rapid execution loops',
  },
  Green: {
    label: 'Architect',
    hex: '#639922',
    tint: '#EAF3DE',
    text: '#3B6D11',
    focus: 'logic, quality, and durable systems',
    contribution: 'rigor, precision, and thoughtful tradeoffs',
    blindSpot: 'analysis can delay commitment',
    preferredCadence: 'time to think, validate, and refine',
  },
  Blue: {
    label: 'Visionary',
    hex: '#378ADD',
    tint: '#E6F1FB',
    text: '#185FA5',
    focus: 'possibility, pattern recognition, and innovation',
    contribution: 'new angles, reframing, and future-state thinking',
    blindSpot: 'ideas can drift without a landing zone',
    preferredCadence: 'wide exploration before narrowing',
  },
};

const RISK_ORDER: Record<PairRisk, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const ROLE_TOKEN_STOP_WORDS = new Set([
  'and',
  'assistant',
  'associate',
  'chief',
  'coordinator',
  'department',
  'director',
  'for',
  'head',
  'intern',
  'jr',
  'junior',
  'lead',
  'manager',
  'of',
  'principal',
  'senior',
  'specialist',
  'staff',
  'sr',
  'team',
  'the',
  'vice',
  'vp',
]);

const FUNCTION_FAMILY_KEYWORDS: Record<string, string[]> = {
  engineering: ['engineer', 'engineering', 'developer', 'software', 'platform', 'frontend', 'backend', 'fullstack', 'devops', 'sre', 'qa', 'tester'],
  product: ['product', 'program', 'project', 'owner', 'scrum'],
  design: ['design', 'designer', 'ux', 'ui', 'creative', 'brand'],
  marketing: ['marketing', 'growth', 'content', 'communications', 'social', 'seo'],
  sales: ['sales', 'account', 'revenue', 'business development', 'bdr', 'sdr', 'partnerships'],
  success: ['customer success', 'support', 'success', 'implementation', 'services'],
  operations: ['operations', 'ops', 'office', 'logistics', 'supply', 'facilities'],
  people: ['people', 'hr', 'human resources', 'talent', 'recruit', 'recruiter', 'recruiting', 'learning'],
  finance: ['finance', 'accounting', 'controller', 'fp&a', 'payroll', 'bookkeeper'],
  data: ['data', 'analytics', 'analyst', 'science', 'scientist', 'insights', 'bi'],
  legal: ['legal', 'compliance', 'counsel', 'privacy', 'risk'],
};

const BROAD_COLLABORATORS = new Set(['operations', 'people', 'finance', 'product', 'success']);
const EXECUTIVE_HINTS = ['founder', 'ceo', 'coo', 'cto', 'cfo', 'president', 'executive'];

export const CLASH_PATTERNS: Record<string, ClashPattern> = {
  'Blue-Green': {
    key: 'Blue-Green',
    name: 'Abstraction trap',
    risk: 'medium',
    summary: 'Both people can stay in concepts too long, which delays concrete handoffs and visible progress.',
    why: 'Blue pushes for possibility while Green pushes for rigor. Without a forcing function, the team keeps refining the model instead of shipping the next move.',
    strengths: [
      'This pair sees blind spots before they become expensive.',
      'They are strong at design reviews, roadmap quality, and long-range problem framing.',
      'They can produce thoughtful solutions that feel both original and well-structured.',
    ],
    watchouts: [
      'Meetings can feel productive without producing ownership or deadlines.',
      'Teammates may hear a lot of nuance but not know what happens next.',
      'Execution partners can feel blocked waiting for a final answer.',
    ],
    actions: [
      'End every planning conversation with one named owner and one dated deliverable.',
      'Split ideation time from decision time so exploration does not consume the whole meeting.',
      'Use a lightweight definition of done before the conversation begins.',
    ],
  },
  'Blue-Red': {
    key: 'Blue-Red',
    name: 'Authority clash',
    risk: 'high',
    summary: 'Both people tend to drive the room. One leads with vision and reframing, the other with relational energy and influence.',
    why: 'Blue wants room to reshape the direction. Red wants to move people into alignment quickly. When ownership is fuzzy, both can feel they are carrying the conversation.',
    strengths: [
      'The pair can energize a room and get people to care about the work.',
      'They are powerful in ambiguity when the team needs momentum and imagination.',
      'Together they can reframe stale problems into compelling action.',
    ],
    watchouts: [
      'Meetings can become a contest over whose framing sets the agenda.',
      'Other teammates may stop contributing because the room feels crowded.',
      'Execution details get lost once the emotional and strategic energy rises.',
    ],
    actions: [
      'Set a clear decision owner before the meeting starts.',
      'Use one person to generate options and the other to land stakeholder alignment, not both at once.',
      'Capture decisions in writing before leaving the room.',
    ],
  },
  'Blue-Yellow': {
    key: 'Blue-Yellow',
    name: 'Direction trap',
    risk: 'high',
    summary: 'Blue keeps expanding the horizon while Yellow wants a stable target and a sequence to execute.',
    why: 'Blue often improves the idea while Yellow is already trying to ship it. Each person experiences the other as either premature closure or endless drift.',
    strengths: [
      'This pair can turn bold ideas into real execution when handoffs are explicit.',
      'Blue helps Yellow avoid narrow thinking; Yellow helps Blue avoid vapor.',
      'They are strong in zero-to-one work that still needs disciplined delivery.',
    ],
    watchouts: [
      'Priorities can keep changing once Yellow has already committed resources.',
      'Blue may feel constrained too early, while Yellow feels rework piling up.',
      'Trust drops when promise dates move without a shared reset.',
    ],
    actions: [
      'Separate idea generation from execution commitment in the workflow.',
      'Agree on the version that is shipping now versus ideas parked for later.',
      'Use written change logs when scope shifts.',
    ],
  },
  'Green-Red': {
    key: 'Green-Red',
    name: 'Speed trap',
    risk: 'high',
    summary: 'Red wants to move now and Green wants to understand the system before committing.',
    why: 'Red experiences rigor as delay. Green experiences speed as unforced error. Without a shared operating rhythm, both people believe they are protecting the team from the other.',
    strengths: [
      'This pair combines stakeholder sensitivity with strong judgment when they trust each other.',
      'Red keeps the work human and moving; Green keeps it coherent and durable.',
      'They can balance urgency with quality in high-stakes decisions.',
    ],
    watchouts: [
      'Red may over-interpret Green as negative or resistant.',
      'Green may over-interpret Red as shallow or politically driven.',
      'Escalations happen when decisions are pushed before Green sees enough evidence.',
    ],
    actions: [
      'Create a short discovery window, then a hard decision window.',
      'Ask Green to define the minimum evidence needed before commitment.',
      'Ask Red to frame the cost of delay so tradeoffs are visible.',
    ],
  },
  'Green-Yellow': {
    key: 'Green-Yellow',
    name: 'Precision trap',
    risk: 'medium',
    summary: 'Yellow optimizes for movement and completion while Green optimizes for soundness and long-term quality.',
    why: 'Yellow wants enough clarity to move. Green wants enough clarity to avoid preventable rework. The tension usually comes from different thresholds, not bad intent.',
    strengths: [
      'This pair can produce reliable execution with fewer surprises.',
      'Yellow pushes the team to convert plans into output.',
      'Green protects the team from quality debt and fragile decisions.',
    ],
    watchouts: [
      'Yellow can feel slowed down by open questions that Green still sees as material.',
      'Green can feel ignored when delivery pressure starts dominating the conversation.',
      'Small quality issues become recurring friction if they are never named explicitly.',
    ],
    actions: [
      'Define what must be perfect and what can be iterated later.',
      'Use pre-agreed quality checks rather than debating standards each time.',
      'Review post-launch issues together so future tradeoffs improve.',
    ],
  },
  'Red-Yellow': {
    key: 'Red-Yellow',
    name: 'Pace trap',
    risk: 'medium',
    summary: 'Red pushes urgency through people and energy while Yellow pushes urgency through tasks and sequence.',
    why: 'Both want movement, but they create it differently. Red leans on shared momentum and responsiveness; Yellow leans on clarity, scope, and ownership.',
    strengths: [
      'This pair can create serious momentum once the plan is clear.',
      'Red keeps engagement high while Yellow keeps execution moving.',
      'They are strong in launches, sprints, and deadline-driven work.',
    ],
    watchouts: [
      "Red can unintentionally create last-minute pivots that break Yellow's plan.",
      'Yellow can sound overly blunt when Red is trying to preserve morale.',
      'The team can confuse movement with alignment if the pair does not pause to check understanding.',
    ],
    actions: [
      'Agree on which decisions are still fluid and which are now fixed.',
      'Let Red handle stakeholder temperature while Yellow runs the execution checklist.',
      'Use short weekly resets to surface surprises before they become pressure.',
    ],
  },
};

function normalizeColorValue(value: string): RoleColor | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'red') return 'Red';
  if (normalized === 'yellow') return 'Yellow';
  if (normalized === 'green') return 'Green';
  if (normalized === 'blue') return 'Blue';
  return null;
}

export function resolveRoleColor(raw: unknown): RoleColor | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    return normalizeColorValue(raw);
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const resolved = resolveRoleColor(item);
      if (resolved) return resolved;
    }
    return null;
  }

  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    for (const key of [
      'dominantColor',
      'dominant_color',
      'primaryColor',
      'primary_color',
      'color',
      'roleColor',
      'role_color',
      'results',
    ]) {
      const resolved = resolveRoleColor(record[key]);
      if (resolved) return resolved;
    }
  }

  return null;
}

export function normalizeColorPair(a: RoleColor, b: RoleColor): string {
  return [a, b].sort().join('-');
}

export function getClashPattern(a: RoleColor | null, b: RoleColor | null): ClashPattern | null {
  if (!a || !b) return null;
  return CLASH_PATTERNS[normalizeColorPair(a, b)] ?? null;
}

export function getPairRisk(a: RoleColor | null, b: RoleColor | null): PairRisk {
  return getClashPattern(a, b)?.risk ?? 'low';
}

function normalizeRoleTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRoleTokens(title: string): string[] {
  return normalizeRoleTitle(title)
    .split(' ')
    .filter((token) => token.length > 2 && !ROLE_TOKEN_STOP_WORDS.has(token));
}

function getFunctionFamilies(title: string): string[] {
  const normalized = normalizeRoleTitle(title);
  return Object.entries(FUNCTION_FAMILY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([family]) => family);
}

function labelFamily(family: string): string {
  return family.charAt(0).toUpperCase() + family.slice(1);
}

function findOverlap(a: string[], b: string[]): string[] {
  const lookup = new Set(b);
  return a.filter((value) => lookup.has(value));
}

function getCollaborationReason(jobRoleA: string | null, jobRoleB: string | null): string | null {
  if (!jobRoleA || !jobRoleB) {
    return 'Included because one or both job roles are missing.';
  }

  const normalizedA = normalizeRoleTitle(jobRoleA);
  const normalizedB = normalizeRoleTitle(jobRoleB);

  if (normalizedA === normalizedB) {
    return 'Included because they share the same role.';
  }

  const tokensA = getRoleTokens(jobRoleA);
  const tokensB = getRoleTokens(jobRoleB);
  const tokenOverlap = findOverlap(tokensA, tokensB);

  if (tokenOverlap.length > 0) {
    return `Included because both roles overlap around ${tokenOverlap.slice(0, 2).join(' and ')}.`;
  }

  const familiesA = getFunctionFamilies(jobRoleA);
  const familiesB = getFunctionFamilies(jobRoleB);
  const familyOverlap = findOverlap(familiesA, familiesB);

  if (familyOverlap.length > 0) {
    return `Included because both roles sit in ${labelFamily(familyOverlap[0])}.`;
  }

  const aIsExecutive = EXECUTIVE_HINTS.some((hint) => normalizedA.includes(hint));
  const bIsExecutive = EXECUTIVE_HINTS.some((hint) => normalizedB.includes(hint));

  if ((aIsExecutive && familiesB.length > 0) || (bIsExecutive && familiesA.length > 0)) {
    return 'Included because leadership and functional roles usually coordinate closely.';
  }

  if (familiesA.some((family) => BROAD_COLLABORATORS.has(family)) || familiesB.some((family) => BROAD_COLLABORATORS.has(family))) {
    return 'Included because one of these functions typically collaborates across the business.';
  }

  return null;
}

export function buildRelevantPairs(members: CompanyMember[]): RelevantPair[] {
  const assessedMembers = members.filter((member) => Boolean(member.roleColor));
  const pairs: RelevantPair[] = [];

  for (let index = 0; index < assessedMembers.length; index += 1) {
    for (let innerIndex = index + 1; innerIndex < assessedMembers.length; innerIndex += 1) {
      const first = assessedMembers[index];
      const second = assessedMembers[innerIndex];
      const collabReason = getCollaborationReason(first.jobRole, second.jobRole);

      if (first.jobRole && second.jobRole && !collabReason) {
        continue;
      }

      const clash = getClashPattern(first.roleColor, second.roleColor);
      pairs.push({
        id: [first.id, second.id].sort().join(':'),
        key: first.roleColor && second.roleColor ? normalizeColorPair(first.roleColor, second.roleColor) : null,
        a: first,
        b: second,
        clash,
        risk: getPairRisk(first.roleColor, second.roleColor),
        collabReason,
      });
    }
  }

  return pairs.sort((left, right) => {
    const riskDelta = RISK_ORDER[left.risk] - RISK_ORDER[right.risk];
    if (riskDelta !== 0) return riskDelta;

    const leftNames = `${left.a.name} ${left.b.name}`;
    const rightNames = `${right.a.name} ${right.b.name}`;
    return leftNames.localeCompare(rightNames);
  });
}

export function buildPairFromMembers(a: CompanyMember, b: CompanyMember): RelevantPair {
  const sorted = [a, b].sort((left, right) => left.name.localeCompare(right.name));
  const first = sorted[0];
  const second = sorted[1];

  return {
    id: [first.id, second.id].sort().join(':'),
    key: first.roleColor && second.roleColor ? normalizeColorPair(first.roleColor, second.roleColor) : null,
    a: first,
    b: second,
    clash: getClashPattern(first.roleColor, second.roleColor),
    risk: getPairRisk(first.roleColor, second.roleColor),
    collabReason: getCollaborationReason(first.jobRole, second.jobRole),
  };
}

function buildGenericStrengths(a: RoleColorMeta, b: RoleColorMeta): string[] {
  if (a.label === b.label) {
    return [
      `They share a natural language around ${a.focus}.`,
      `Trust usually builds quickly because both people value ${a.preferredCadence}.`,
      `This pair can move with confidence once priorities are clear.`,
    ];
  }

  return [
    `${a.label}s bring ${a.contribution}.`,
    `${b.label}s bring ${b.contribution}.`,
    `Together they can balance ${a.focus} with ${b.focus}.`,
  ];
}

function buildGenericWatchouts(a: RoleColorMeta, b: RoleColorMeta): string[] {
  if (a.label === b.label) {
    return [
      `The same blind spot can compound because both people tend to believe the same signals: ${a.blindSpot}.`,
      'Opposing viewpoints can arrive too late because the pair feels aligned early.',
      'The team may miss complementary styles if these two dominate the working rhythm.',
    ];
  }

  return [
    `${a.label}s can read ${b.preferredCadence} as friction when pressure is high.`,
    `${b.label}s can read ${a.preferredCadence} as unnecessary slowdown or noise.`,
    'If decision rights stay fuzzy, each person will optimize for a different success metric.',
  ];
}

function buildGenericActions(a: RoleColorMeta, b: RoleColorMeta): string[] {
  if (a.label === b.label) {
    return [
      'Invite one teammate with a contrasting style into major decisions before locking them.',
      'Use a brief pre-mortem to challenge assumptions you both share.',
      'Document next steps immediately so alignment turns into visible execution.',
    ];
  }

  return [
    `Agree on when ${a.label.toLowerCase()} strengths should lead and when ${b.label.toLowerCase()} strengths should lead.`,
    'Make the handoff explicit: who decides, who reviews, and what good looks like.',
    'Use a short weekly reset to surface tension before it turns personal.',
  ];
}

export function buildPairDetail(pair: RelevantPair): PairDetail {
  const roleA = pair.a.roleColor ? ROLE_COLOR_META[pair.a.roleColor] : null;
  const roleB = pair.b.roleColor ? ROLE_COLOR_META[pair.b.roleColor] : null;

  if (!roleA || !roleB) {
    const roleNames = [pair.a.jobRole, pair.b.jobRole].filter(Boolean).join(' and ');
    return {
      title: 'Assessment-based detail is partially unavailable',
      summary: roleNames
        ? `This pair can still be reviewed through their reported job roles (${roleNames}), but the strongest friction signals will appear once both assessments are complete.`
        : 'This pair is missing one or more RoleColor assessments, so the map cannot produce a full color-based friction read yet.',
      assessmentReady: false,
      strengths: [
        'The pair can still align quickly if ownership and goals are explicit.',
        'Job-role context can help identify where collaboration is likely to matter most.',
        'Completing both assessments will make future guidance more specific and more actionable.',
      ],
      watchouts: [
        'Without both assessments, it is easier to misread style differences as performance issues.',
        'Conflict signals may look random because the underlying preference pattern is hidden.',
        'Teams often over-index on job title and miss communication style until tension is already visible.',
      ],
      actions: [
        'Ask both people to complete the relevant assessment for a full Team Friction Map readout.',
        'Clarify who owns the decision, who executes, and who reviews before the next shared project.',
        'Use a short weekly alignment check to catch friction early.',
      ],
    };
  }

  const clash = pair.clash;

  if (clash) {
    return {
      title: clash.name,
      summary: clash.why,
      assessmentReady: true,
      strengths: clash.strengths,
      watchouts: clash.watchouts,
      actions: clash.actions,
    };
  }

  return {
    title: roleA.label === roleB.label ? `${roleA.label} mirror pair` : 'Complementary partnership',
    summary:
      roleA.label === roleB.label
        ? `Both people prioritize ${roleA.focus}. That usually creates fast rapport, but it can also amplify the same blind spot if nobody introduces a counterweight.`
        : `${roleA.label}s tend to optimize for ${roleA.focus}, while ${roleB.label}s optimize for ${roleB.focus}. With clear handoffs, the pairing is usually more complementary than adversarial.`,
    assessmentReady: true,
    strengths: buildGenericStrengths(roleA, roleB),
    watchouts: buildGenericWatchouts(roleA, roleB),
    actions: buildGenericActions(roleA, roleB),
  };
}
