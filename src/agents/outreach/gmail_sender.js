import { createGmailClient, encodePlainTextEmail } from '../../lib/gmail.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { optionalEnv } from '../../lib/env.js';
import { getServiceSupabase } from '../../lib/supabase.js';

export const resolveSenderCredentials = withAgentErrorHandling(
  {
    agentName: 'Gio',
    action: 'resolve_sender_credentials_failed',
    getContext: ([options]) => ({ tenantId: options?.tenantId || null })
  },
  async ({
  tenantId = null,
  inboxEmail = null,
  senderCredentials = null
} = {}) => {
    if (senderCredentials) {
      return senderCredentials;
    }

    const supabase = getServiceSupabase();
    let query = supabase
      .from('inboxes')
      .select('email, credentials')
      .eq('active', true);

    if (inboxEmail) {
      query = query.eq('email', inboxEmail).limit(1);
    } else if (tenantId) {
      query = query.eq('tenant_id', tenantId).limit(1);
    } else {
      query = query.limit(1);
    }

    const { data, error } = await query;

    if (!error && data?.[0]?.credentials) {
      return data[0].credentials;
    }

    const systemCredentials = optionalEnv('SYSTEM_GMAIL_CREDENTIALS');

    if (systemCredentials) {
      return JSON.parse(systemCredentials);
    }

    throw new Error('No Gmail sender credentials available. Connect an inbox or set SYSTEM_GMAIL_CREDENTIALS.');
  }
);

export const sendEmail = withAgentErrorHandling(
  {
    agentName: 'Gio',
    action: 'send_email_failed',
    getContext: ([payload]) => ({
      tenantId: payload?.tenantId || null,
      leadId: payload?.leadId || null
    })
  },
  async ({
  leadId,
  tenantId = null,
  inboxEmail = null,
  to,
  subject,
  body,
  senderCredentials,
  agentName = 'Gio'
}) => {
    const supabase = getServiceSupabase();
    try {
      const credentials = await resolveSenderCredentials({ tenantId, inboxEmail, senderCredentials });
      const gmail = createGmailClient(credentials);
      const raw = encodePlainTextEmail({ to, subject, body });

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
      });

      if (leadId) {
        await supabase
          .from('outreach_log')
          .update({ sent_by: agentName })
          .eq('lead_id', leadId)
          .eq('subject', subject);

        await supabase
          .from('leads')
          .update({ status: 'outreach_sent' })
          .eq('id', leadId);
      }

      return { ok: true, messageId: result.data.id };
    } catch (error) {
      await supabase.from('agent_log').insert({
        agent_name: agentName,
        action: 'send_email_failed',
        tenant_id: tenantId,
        lead_id: leadId,
        error: error.message
      });

      return { ok: false, error: error.message };
    }
  }
);
