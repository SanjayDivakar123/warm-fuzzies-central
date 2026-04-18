import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';

const CLASSIFY_PROMPT = `
You are Rex, a reply classification agent.

Categories:
- interested
- not_now
- unsubscribe
- question
- objection

Respond with ONLY JSON:
{
  "intent": "category",
  "confidence": 0,
  "summary": "string"
}
`;

const OBJECTION_RESPONSES = {
  price: 'Acknowledge the concern, reframe around ROI, and offer a lighter starting point.',
  timing: 'Acknowledge timing and ask when to follow up.',
  competitor: 'Acknowledge their current tool and differentiate OutreachOS around autonomous pipeline execution and reply handling.',
  approval: 'Acknowledge the approval process and offer a concise forwardable summary.'
};

export const classifyReply = withAgentErrorHandling(
  {
    agentName: 'Rex',
    action: 'classify_reply_failed',
    getContext: ([, leadId]) => ({ leadId })
  },
  async (replyText, leadId) => {
  const supabase = getServiceSupabase();
  const { data: lead } = await supabase.from('leads').select('tenant_id, email').eq('id', leadId).maybeSingle();
  const raw = await callGroq({
    model: MODELS.FAST,
    messages: [
      { role: 'system', content: CLASSIFY_PROMPT },
      { role: 'user', content: replyText }
    ],
    temperature: 0.1,
    max_tokens: 200
  });

  const classification = parseJsonResponse(raw, {
    intent: 'question',
    confidence: 50,
    summary: 'Fallback classification used after parse failure.'
  });

  await supabase.from('replies').insert({
    lead_id: leadId,
    tenant_id: lead?.tenant_id || null,
    raw_text: replyText,
    classified_intent: classification.intent,
    handled: false
  });

  if (classification.intent === 'interested') {
    await supabase.from('leads').update({ status: 'replied' }).eq('id', leadId);
  }

  if (classification.intent === 'unsubscribe') {
    if (lead?.email) {
      await supabase.from('suppression').upsert({
        email: lead.email,
        reason: 'unsubscribed'
      });
    }

    await supabase.from('leads').update({ status: 'unsubscribed' }).eq('id', leadId);
  }

  return classification;
  }
);

export const handleObjection = withAgentErrorHandling(
  {
    agentName: 'Fen',
    action: 'handle_objection_failed',
    getContext: ([, lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (replyText, lead, type = 'price', agentName = 'Fen') => {
  const raw = await callGroq({
    model: MODELS.SMART,
    messages: [
      {
        role: 'system',
        content: `You are ${agentName}, an objection handling agent. ${OBJECTION_RESPONSES[type] || OBJECTION_RESPONSES.price} Return ONLY JSON: {"subject":"Re: ...","body":"..."}`
      },
      {
        role: 'user',
        content: `Lead: ${lead.name} at ${lead.company}\nReply: ${replyText}`
      }
    ],
    temperature: 0.5,
    max_tokens: 300
  });

  return parseJsonResponse(raw, null);
  }
);
