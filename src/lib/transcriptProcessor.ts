export interface Utterance {
  speaker: string;
  text: string;
  startTimestamp: number;
  endTimestamp: number;
}

export interface ClassifiedUtterance extends Utterance {
  rolecolorSignal: 'red' | 'yellow' | 'green' | 'blue' | null;
  confidence: number;
  wordCount: number;
}

export interface MeetingData {
  title: string;
  platform: string;
  participants: string[];
  utterances: ClassifiedUtterance[];
  startedAt: string;
  endedAt: string;
}

export interface GeneratedReport {
  summary: string;
  alignmentScore: number;
  keyMoments: Array<{
    timestampMs: number;
    speaker: string;
    text: string;
    rolecolor: string;
  }>;
  actionItems: Array<{
    task: string;
    owner: string;
    rolecolor: string;
  }>;
  recommendations: Array<{
    speaker: string;
    note: string;
  }>;
  participantDynamics: {
    dominantColor: string;
    secondaryColor: string;
    teamAlignment: string;
  };
}

async function callEdgeFunction(action: string, payload: any) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL not configured');
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/process-transcript`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    }
  );

  if (!response.ok) {
    throw new Error(`Edge function error: ${response.statusText}`);
  }

  return response.json();
}

export async function classifyUtterance(text: string): Promise<{
  signal: 'red' | 'yellow' | 'green' | 'blue' | null;
  confidence: number;
}> {
  if (!text || text.trim().length === 0) {
    return { signal: null, confidence: 0 };
  }

  try {
    return await callEdgeFunction('classify', { text });
  } catch (error) {
    console.error('Error classifying utterance:', error);
    return { signal: null, confidence: 0 };
  }
}

export async function classifyAllUtterances(
  utterances: Utterance[]
): Promise<ClassifiedUtterance[]> {
  const classified: ClassifiedUtterance[] = [];

  for (const utterance of utterances) {
    const wordCount = utterance.text.split(/\s+/).filter(w => w.length > 0).length;

    let rolecolorSignal: 'red' | 'yellow' | 'green' | 'blue' | null = null;
    let confidence = 0;

    if (wordCount >= 10) {
      const result = await classifyUtterance(utterance.text);
      rolecolorSignal = result.signal;
      confidence = result.confidence;
    }

    classified.push({
      ...utterance,
      rolecolorSignal,
      confidence,
      wordCount
    });
  }

  return classified;
}

export async function generateMeetingReport(
  meetingData: MeetingData
): Promise<GeneratedReport> {
  try {
    return await callEdgeFunction('generate-report', { meetingData });
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate meeting report');
  }
}

export function calculateSpeakerStats(utterances: ClassifiedUtterance[]) {
  const stats = new Map<string, {
    utteranceCount: number;
    wordCount: number;
    talkTimeMs: number;
    signalCounts: Record<string, number>;
    dominantSignal: string | null;
  }>();

  for (const utterance of utterances) {
    if (!stats.has(utterance.speaker)) {
      stats.set(utterance.speaker, {
        utteranceCount: 0,
        wordCount: 0,
        talkTimeMs: 0,
        signalCounts: {},
        dominantSignal: null
      });
    }

    const stat = stats.get(utterance.speaker)!;
    stat.utteranceCount += 1;
    stat.wordCount += utterance.wordCount;
    stat.talkTimeMs += utterance.endTimestamp - utterance.startTimestamp;

    if (utterance.rolecolorSignal) {
      stat.signalCounts[utterance.rolecolorSignal] =
        (stat.signalCounts[utterance.rolecolorSignal] || 0) + 1;
    }
  }

  // Calculate dominant signal
  for (const stat of stats.values()) {
    const signals = Object.entries(stat.signalCounts).sort((a, b) => b[1] - a[1]);
    stat.dominantSignal = signals.length > 0 ? signals[0][0] : null;
  }

  return stats;
}

export function fuzzyMatchSpeaker(
  detectedName: string,
  companyUsers: Array<{ id: string; firstName: string; lastName: string }>
): { userId: string | null; confidence: number } {
  if (!detectedName || companyUsers.length === 0) {
    return { userId: null, confidence: 0 };
  }

  const detected = detectedName.toLowerCase().trim();
  let bestMatch = { userId: null as string | null, confidence: 0 };

  for (const user of companyUsers) {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase().trim();
    const firstName = user.firstName.toLowerCase().trim();
    const lastName = user.lastName.toLowerCase().trim();

    let score = 0;

    // Exact match
    if (fullName === detected) {
      score = 1.0;
    }
    // One name matches exactly
    else if (firstName === detected || lastName === detected) {
      score = 0.9;
    }
    // First name match
    else if (detected.startsWith(firstName) || firstName.includes(detected)) {
      score = 0.75;
    }
    // Last name match
    else if (detected.startsWith(lastName) || lastName.includes(detected)) {
      score = 0.7;
    }
    // Partial match
    else if (fullName.includes(detected) || detected.includes(firstName)) {
      score = 0.6;
    }

    if (score > bestMatch.confidence) {
      bestMatch = { userId: user.id, confidence: score };
    }
  }

  return bestMatch.confidence >= 0.6 ? bestMatch : { userId: null, confidence: 0 };
}
