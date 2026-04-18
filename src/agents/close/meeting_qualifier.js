import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';

export const qualifyAndBook = withAgentErrorHandling(
  {
    agentName: 'Mael',
    action: 'qualify_and_book_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead) => {
  const supabase = getServiceSupabase();
  let calendlyUrl = process.env.CALENDLY_URL;

  if (lead?.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('calendly_url')
      .eq('id', lead.tenant_id)
      .maybeSingle();

    calendlyUrl = tenant?.calendly_url || calendlyUrl;
  }

  const raw = await callGroq({
    model: MODELS.SMART,
    messages: [
      {
        role: 'user',
        content: `Write a short email under 80 words confirming interest and sharing a Calendly link for a 20-minute demo. Lead: ${lead.name} at ${lead.company}. Link: ${calendlyUrl}. Return JSON: {"subject":"...","body":"..."}`
      }
    ],
    temperature: 0.5,
    max_tokens: 200
  });

  const email = parseJsonResponse(raw, null);

  await supabase.from('leads').update({ status: 'meeting_booked' }).eq('id', lead.id);

  await supabase.from('agent_log').insert({
    agent_name: 'Mael',
    action: 'meeting_booked_notify_human',
    lead_id: lead.id,
    result: `HUMAN NEEDED: ${lead.name} at ${lead.company} booked a demo.`
  });

  return email;
  }
);
