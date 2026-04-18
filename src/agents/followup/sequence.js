import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';
import { sendEmail } from '../outreach/gmail_sender.js';

const FOLLOWUP_PROMPTS = {
  day3: 'Write a short follow-up email under 80 words. Reference the previous email briefly, add a new angle, and end with a soft CTA.',
  day7: 'Write a second follow-up email under 80 words. Use a new angle and keep the CTA low-friction.',
  day14: 'Write a final breakup email under 60 words. Friendly tone, last-touch framing, leave the door open.'
};

function getDayKey(touchNumber) {
  if (touchNumber === 2) return 'day3';
  if (touchNumber === 3) return 'day7';
  return 'day14';
}

export const writeFollowUp = withAgentErrorHandling(
  {
    agentName: 'Followup',
    action: 'write_followup_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, touchNumber, previousEmails, agentName) => {
  const dayKey = getDayKey(touchNumber);
  const raw = await callGroq({
    model: MODELS.SMART,
    messages: [
      {
        role: 'system',
        content: `You are ${agentName}, a follow-up email agent. ${FOLLOWUP_PROMPTS[dayKey]} Return ONLY JSON: {"subject":"...","body":"..."}`
      },
      {
        role: 'user',
        content: `Lead: ${lead.name} at ${lead.company} (${lead.title})\nPrevious subject: ${previousEmails?.[0]?.subject || 'N/A'}`
      }
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  return parseJsonResponse(raw, null);
  }
);

export const runFollowUpCycle = withAgentErrorHandling(
  {
    agentName: 'Followup',
    action: 'followup_cycle_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId = null) => {
  const supabase = getServiceSupabase();
  const now = Date.now();
  let query = supabase
    .from('leads')
    .select('*, outreach_log(*)')
    .eq('status', 'outreach_sent');

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: leads, error } = await query;

  if (error) {
    throw error;
  }

  const results = [];

  for (const lead of leads || []) {
    if (!lead.email) {
      continue;
    }

    const previousEmails = (lead.outreach_log || [])
      .filter((entry) => entry.channel === 'email')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (previousEmails.length === 0) {
      continue;
    }

    const lastTouch = previousEmails[previousEmails.length - 1];
    const daysSinceLastTouch = (now - new Date(lastTouch.created_at).getTime()) / (24 * 60 * 60 * 1000);

    let touchNumber = null;
    let agentName = null;

    if (lastTouch.touch_number === 1 && daysSinceLastTouch >= 3) {
      touchNumber = 2;
      agentName = 'Vex';
    } else if (lastTouch.touch_number === 2 && daysSinceLastTouch >= 4) {
      touchNumber = 3;
      agentName = 'Lev';
    } else if (lastTouch.touch_number === 3 && daysSinceLastTouch >= 7) {
      touchNumber = 4;
      agentName = 'Echo';
    }

    if (!touchNumber) {
      continue;
    }

    const email = await writeFollowUp(lead, touchNumber, previousEmails, agentName);

    if (!email) {
      continue;
    }

    await supabase.from('outreach_log').insert({
      lead_id: lead.id,
      tenant_id: lead.tenant_id || null,
      channel: 'email',
      subject: email.subject,
      body: email.body,
      sent_by: agentName,
      touch_number: touchNumber
    });

    const sent = await sendEmail({
      leadId: lead.id,
      tenantId: lead.tenant_id || null,
      to: lead.email,
      subject: email.subject,
      body: email.body,
      agentName
    });

    results.push({
      lead_id: lead.id,
      touch: touchNumber,
      sent: sent.ok
    });
  }

  return results;
  }
);
