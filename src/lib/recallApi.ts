const RECALL_BASE = 'https://us-east-1.recall.ai/api/v1';

const headers = () => ({
  'Authorization': `Token ${import.meta.env.VITE_RECALL_API_KEY}`,
  'Content-Type': 'application/json'
});

export interface CreateBotPayload {
  meetingUrl: string;
  webhookUrl: string;
}

export interface BotResponse {
  id: string;
  meeting_url: string;
  status: string;
  created_at: string;
  recording_started: boolean;
}

export interface TranscriptResponse {
  utterances: Array<{
    speaker: string;
    text: string;
    start_timestamp: number;
    end_timestamp: number;
  }>;
  speakers: Array<{
    name: string;
  }>;
}

export async function createBot({ meetingUrl, webhookUrl }: CreateBotPayload): Promise<BotResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL not configured');
  }

  const url = `${supabaseUrl}/functions/v1/create-bot`;
  console.log('Creating bot:', { url, meetingUrl, webhookUrl });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meetingUrl,
      webhookUrl
    })
  });

  if (!res.ok) {
    console.error('Bot creation failed:', res.status, res.statusText);
    const text = await res.text();
    console.error('Response body:', text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || `Failed to create bot: ${res.status}`);
    } catch (e) {
      throw new Error(`Failed to create bot: ${res.status}`);
    }
  }

  return res.json();
}

export async function getBotTranscript(botId: string): Promise<TranscriptResponse> {
  const res = await fetch(`${RECALL_BASE}/bot/${botId}/transcript/`, {
    headers: headers()
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || `Failed to fetch transcript: ${res.status}`);
  }

  return res.json();
}

export async function getBotStatus(botId: string) {
  const res = await fetch(`${RECALL_BASE}/bot/${botId}/`, {
    headers: headers()
  });

  if (!res.ok) {
    throw new Error(`Failed to get bot status: ${res.status}`);
  }

  return res.json();
}

export async function getCallParticipants(botId: string) {
  const res = await fetch(`${RECALL_BASE}/bot/${botId}/call_participants/`, {
    headers: headers()
  });

  if (!res.ok) {
    throw new Error(`Failed to get participants: ${res.status}`);
  }

  return res.json();
}

export function detectPlatform(url: string): 'zoom' | 'google_meet' | 'teams' | null {
  if (!url) return null;

  if (url.includes('zoom.us') || url.includes('zoom.com')) return 'zoom';
  if (url.includes('meet.google.com')) return 'google_meet';
  if (url.includes('teams.microsoft.com')) return 'teams';

  return null;
}
