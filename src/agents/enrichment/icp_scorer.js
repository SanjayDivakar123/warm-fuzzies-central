import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';

const ICP_PROMPT = `
You are Aria, an ICP scoring agent for OutreachOS.

OutreachOS sells an autonomous AI sales platform to businesses.

Ideal customer profile:
- Company size: 20-500 employees
- Role: HR Director, VP People, COO, Founder/CEO, Chief People Officer, Head of Culture
- Industry: Tech, professional services, consulting, agencies, fast-growing startups
- Signals: Hiring multiple managers, recent funding, culture initiatives, team growth

Respond with ONLY JSON:
{
  "score": 0,
  "reason": "string",
  "hook": "string"
}
`;

export const scoreLeadICP = withAgentErrorHandling(
  {
    agentName: 'Aria',
    action: 'score_icp_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead) => {
  const supabase = getServiceSupabase();
  const leadDescription = `
Name: ${lead.name || 'Unknown'}
Title: ${lead.title || 'Unknown'}
Company: ${lead.company || 'Unknown'}
Source: ${lead.source || 'Unknown'}
LinkedIn: ${lead.linkedin_url || 'N/A'}
  `.trim();

  const raw = await callGroq({
    model: MODELS.FAST,
    messages: [
      { role: 'system', content: ICP_PROMPT },
      { role: 'user', content: leadDescription }
    ],
    temperature: 0.1,
    max_tokens: 400
  });

  const parsed = parseJsonResponse(raw, {
    score: 50,
    reason: 'Fallback score used after parse failure.',
    hook: ''
  });

  await supabase
    .from('leads')
    .update({
      icp_score: parsed.score,
      personalization_hook: parsed.hook,
      status: 'enriched'
    })
    .eq('id', lead.id);

  return parsed;
  }
);
