export type FollowUpContextType = 'candidate-fit' | 'team-insights';

export interface FollowUpMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FollowUpQuestionEvaluation {
  allowed: boolean;
  responseMessage?: string;
}

export const FOLLOW_UP_OFF_TOPIC_MESSAGE =
  "We aren't able to answer that question here. Please contact support@rolecolorfinder.com.";

const SHORT_FOLLOW_UP_PATTERNS = [
  /^why[?.! ]*$/i,
  /^how so[?.! ]*$/i,
  /^what else[?.! ]*$/i,
  /^which one[?.! ]*$/i,
  /^who specifically[?.! ]*$/i,
  /^tell me more[?.! ]*$/i,
  /^explain more[?.! ]*$/i,
  /^expand on that[?.! ]*$/i,
  /^can you expand(?: on that)?[?.! ]*$/i,
  /^can you elaborate(?: on that)?[?.! ]*$/i,
  /^what do you mean[?.! ]*$/i,
  /^based on what[?.! ]*$/i,
];

const SHARED_KEYWORDS = [
  'rolecolor',
  'role color',
  'assessment',
  'assessments',
  'color',
  'colours',
  'yellow',
  'red',
  'green',
  'blue',
  'executor',
  'motivator',
  'organizer',
  'innovator',
  'leadership',
  'leader',
  'leaders',
  'manager',
  'management',
  'strength',
  'strengths',
  'weakness',
  'weaknesses',
  'concern',
  'concerns',
  'recommendation',
  'recommendations',
];

const CONTEXT_KEYWORDS: Record<FollowUpContextType, string[]> = {
  'candidate-fit': [
    'candidate',
    'interview',
    'interviews',
    'hire',
    'hiring',
    'fit',
    'role fit',
    'red flag',
    'red flags',
    'job',
    'position',
    'onboard',
    'lead',
    'leadership potential',
  ],
  'team-insights': [
    'team',
    'roles',
    'missing roles',
    'collaboration',
    'conflict',
    'communication',
    'workload',
    'ownership',
    'delegation',
    'team dynamics',
    'optimize',
    'optimization',
    'manager',
    'lead',
    'morale',
  ],
};

const STOP_WORDS = new Set([
  'a', 'about', 'after', 'again', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'can', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'please', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
]);

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function collectContextStrings(value: unknown, collector: string[], seen = new Set<unknown>) {
  if (value == null || collector.length >= 80 || seen.has(value)) {
    return;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      collector.push(trimmed);
    }
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      collectContextStrings(item, collector, seen);
      if (collector.length >= 80) {
        return;
      }
    }
    return;
  }

  for (const nestedValue of Object.values(value)) {
    collectContextStrings(nestedValue, collector, seen);
    if (collector.length >= 80) {
      return;
    }
  }
}

function extractContextTokens(contextData: unknown): Set<string> {
  const strings: string[] = [];
  collectContextStrings(contextData, strings);

  return new Set(
    strings
      .flatMap((value) => tokenize(value))
      .filter((token) => token.length >= 4 || token === 'hr'),
  );
}

function matchesShortFollowUp(question: string): boolean {
  const trimmedQuestion = question.trim();
  return SHORT_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(trimmedQuestion));
}

function countKeywordMatches(question: string, keywords: string[]): number {
  return keywords.reduce(
    (count, keyword) => (question.includes(keyword) ? count + 1 : count),
    0,
  );
}

export function evaluateFollowUpQuestion({
  contextType,
  question,
  contextData,
  messages = [],
}: {
  contextType: FollowUpContextType;
  question: string;
  contextData?: unknown;
  messages?: FollowUpMessage[];
}): FollowUpQuestionEvaluation {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    return { allowed: false };
  }

  const hasAssistantReply = messages.some((message) => message.role === 'assistant');
  if (hasAssistantReply && matchesShortFollowUp(trimmedQuestion)) {
    return { allowed: true };
  }

  const normalizedQuestion = normalizeText(trimmedQuestion);
  const keywordMatches = countKeywordMatches(normalizedQuestion, [
    ...SHARED_KEYWORDS,
    ...CONTEXT_KEYWORDS[contextType],
  ]);

  if (keywordMatches > 0) {
    return { allowed: true };
  }

  const questionTokens = new Set(tokenize(trimmedQuestion));
  const contextTokens = extractContextTokens(contextData);
  const overlappingTokens = [...questionTokens].filter((token) => contextTokens.has(token));

  if (overlappingTokens.length > 0) {
    return { allowed: true };
  }

  return {
    allowed: false,
    responseMessage: FOLLOW_UP_OFF_TOPIC_MESSAGE,
  };
}
