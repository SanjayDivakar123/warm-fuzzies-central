import { google } from 'googleapis';
import { withAgentErrorHandling } from './agents.js';
import { getServiceSupabase } from './supabase.js';
import { requireEnv } from './env.js';

function createOAuthClient() {
  return new google.auth.OAuth2(
    requireEnv('GMAIL_CLIENT_ID'),
    requireEnv('GMAIL_CLIENT_SECRET'),
    `${requireEnv('VERCEL_URL')}/api/auth/gmail/callback`
  );
}

export function getGmailAuthUrl(state) {
  const oauth2Client = createOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
    state,
    prompt: 'consent'
  });
}

export const handleGmailCallback = withAgentErrorHandling(
  {
    agentName: 'Gmail OAuth',
    action: 'handle_gmail_callback_failed',
    getContext: ([, tenantId]) => ({ tenantId })
  },
  async (code, tenantId) => {
    const supabase = getServiceSupabase();
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress;

    await supabase.from('inboxes').upsert({
      email,
      credentials: tokens,
      active: true,
      warmup_phase: 1,
      daily_cold_limit: 0,
      tenant_id: tenantId || null
    });

    return email;
  }
);

export const getRefreshedCredentials = withAgentErrorHandling(
  {
    agentName: 'Gmail OAuth',
    action: 'refresh_gmail_credentials_failed'
  },
  async (inboxEmail) => {
    const supabase = getServiceSupabase();
    const oauth2Client = createOAuthClient();
    const { data: inbox, error } = await supabase
      .from('inboxes')
      .select('credentials')
      .eq('email', inboxEmail)
      .single();

    if (error) {
      throw error;
    }

    oauth2Client.setCredentials(inbox.credentials);
    const { credentials } = await oauth2Client.refreshAccessToken();
    await supabase.from('inboxes').update({ credentials }).eq('email', inboxEmail);

    return credentials;
  }
);
