import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';

const REACTIVATION_ANGLES = ['new_feature', 'case_study', 'company_news', 'direct_ask'];
const REACTIVATION_PROMPTS = {
  new_feature: 'Write a reactivation email mentioning a relevant new feature. Under 80 words.',
  case_study: 'Write a reactivation email sharing a concise result from a similar company. Under 80 words.',
  company_news: 'Write a reactivation email referencing hiring, growth, or funding momentum. Under 80 words.',
  direct_ask: 'Write a short honest reactivation email acknowledging the silence and checking if timing is better now. Under 60 words.'
};

export const writeReactivationEmail = withAgentErrorHandling(
  {
    agentName: 'Petra',
    action: 'write_reactivation_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, agentName = 'Petra') => {
  const supabase = getServiceSupabase();
  const angle = REACTIVATION_ANGLES[Math.floor(Math.random() * REACTIVATION_ANGLES.length)];
  const response = await callGroq({
    model: MODELS.SMART,
    messages: [
      {
        role: 'system',
        content: `You are ${agentName}, a reactivation email agent for OutreachOS. ${REACTIVATION_PROMPTS[angle]} Respond ONLY with JSON: {"subject":"...","body":"..."}`
      },
      {
        role: 'user',
        content: `Lead: ${lead.name}, ${lead.title} at ${lead.company}. Last contacted: ${lead.updated_at}`
      }
    ],
    temperature: 0.7
  });

  const email = parseJsonResponse(response, null);
  if (!email) return null;

  await supabase.from('outreach_log').insert({
    lead_id: lead.id,
    tenant_id: lead.tenant_id || null,
    channel: 'email',
    subject: email.subject,
    body: email.body,
    sent_by: agentName,
    touch_number: 5
  });

  return email;
  }
);

export const runReactivationCycle = withAgentErrorHandling(
  {
    agentName: 'Petra',
    action: 'reactivation_cycle_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId = null) => {
  const supabase = getServiceSupabase();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from('leads')
    .select('*')
    .in('status', ['outreach_sent', 'enriched'])
    .lt('updated_at', thirtyDaysAgo)
    .limit(20);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: coldLeads, error } = await query;
  if (error) throw error;

  const agents = ['Petra', 'Caden', 'Lune', 'Orla'];
  const results = [];

  for (let index = 0; index < (coldLeads?.length || 0); index += 1) {
    const lead = coldLeads[index];
    const agent = agents[index % agents.length];
    const email = await writeReactivationEmail(lead, agent);
    if (email) results.push({ lead: lead.name, agent, subject: email.subject });
  }

  return results;
  }
);
