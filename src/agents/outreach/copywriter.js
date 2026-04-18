import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';

const COPYWRITER_SYSTEM = `
You are a world-class B2B cold email copywriter for OutreachOS.

Rules:
1. Subject under 8 words
2. 3-4 sentences max
3. Keep total email under 120 words
4. One soft CTA
5. Sound human

Return ONLY JSON:
{
  "subject": "string",
  "body": "string"
}
`;

export const writeColdEmail = withAgentErrorHandling(
  {
    agentName: 'Cole',
    action: 'write_cold_email_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, agentName = 'Cole') => {
  const supabase = getServiceSupabase();
  const prompt = `
Write a cold email for this lead:
Name: ${lead.name || 'Unknown'}
Title: ${lead.title || 'Unknown'}
Company: ${lead.company || 'Unknown'}
Personalization hook: ${lead.personalization_hook || 'None'}
ICP score: ${lead.icp_score ?? 'Unknown'}
  `.trim();

  const raw = await callGroq({
    model: MODELS.SMART,
    messages: [
      { role: 'system', content: COPYWRITER_SYSTEM },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  const email = parseJsonResponse(raw, null);

  if (!email) {
    return null;
  }

  await supabase.from('outreach_log').insert({
    lead_id: lead.id,
    tenant_id: lead.tenant_id || null,
    channel: 'email',
    subject: email.subject,
    body: email.body,
    sent_by: agentName,
    touch_number: 1
  });

  return email;
  }
);
