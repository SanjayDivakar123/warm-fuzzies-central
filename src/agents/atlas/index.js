import { getServiceSupabase } from '../../lib/supabase.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { findEmail } from '../enrichment/email_finder.js';
import { scoreLeadICP } from '../enrichment/icp_scorer.js';
import { writeColdEmail } from '../outreach/copywriter.js';
import { sendEmail } from '../outreach/gmail_sender.js';

const ROUTING = {
  new: 'enrichment',
  enriched: 'outreach',
  outreach_sent: 'followup',
  replied: 'reply_handler',
  meeting_booked: 'human_handoff',
  meeting_completed: 'proposal',
  proposal_sent: 'close',
  payment_received: 'provision'
};

export const routeLead = withAgentErrorHandling(
  {
    agentName: 'Atlas',
    action: 'route_lead_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead) => {
  const supabase = getServiceSupabase();
  const nextStage = ROUTING[lead.status] || 'manual_review';

  await supabase.from('agent_log').insert({
    agent_name: 'Atlas',
    action: `routed_to_${nextStage}`,
    tenant_id: lead.tenant_id || null,
    lead_id: lead.id,
    result: `Lead routed from ${lead.status} to ${nextStage}`
  });

  return nextStage;
  }
);

async function advanceLead(lead) {
  if (lead.status === 'new') {
    await scoreLeadICP(lead);
    await findEmail(lead);
    return { lead_id: lead.id, action: 'enriched' };
  }

  if (lead.status === 'enriched') {
    const emailAddress = lead.email || (await findEmail(lead));

    if (!emailAddress) {
      return { lead_id: lead.id, action: 'skipped_no_email' };
    }

    const email = await writeColdEmail(lead);

    if (!email) {
      return { lead_id: lead.id, action: 'skipped_copy_failed' };
    }

    const sent = await sendEmail({
      leadId: lead.id,
      tenantId: lead.tenant_id || null,
      to: emailAddress,
      subject: email.subject,
      body: email.body,
      agentName: 'Gio'
    });

    return { lead_id: lead.id, action: sent.ok ? 'cold_email_sent' : 'cold_email_failed' };
  }

  return { lead_id: lead.id, action: ROUTING[lead.status] || 'manual_review' };
}

export const getPipelineHealth = withAgentErrorHandling(
  {
    agentName: 'Atlas',
    action: 'pipeline_health_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId = null) => {
  const supabase = getServiceSupabase();
  let query = supabase
    .from('leads')
    .select('status')
    .neq('status', 'closed_lost')
    .neq('status', 'unsubscribed');

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).reduce((counts, lead) => {
    counts[lead.status] = (counts[lead.status] || 0) + 1;
    return counts;
  }, {});
  }
);

export const runOrchestrationCycle = withAgentErrorHandling(
  {
    agentName: 'Atlas',
    action: 'orchestration_cycle_failed',
    getContext: ([, tenantId]) => ({ tenantId })
  },
  async (limit = 50, tenantId = null) => {
  const supabase = getServiceSupabase();
  let query = supabase
    .from('leads')
    .select('*')
    .in('status', ['new', 'enriched', 'outreach_sent', 'replied'])
    .order('created_at', { ascending: true })
    .limit(limit);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: leads, error } = await query;

  if (error) {
    throw error;
  }

  const results = [];

  for (const lead of leads || []) {
    const routed_to = await routeLead(lead);
    const advanced = await advanceLead(lead);
    results.push({ lead_id: lead.id, routed_to, advanced });
  }

  return results;
  }
);
