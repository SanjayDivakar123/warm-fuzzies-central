import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { getServiceSupabase } from '../../lib/supabase.js';

export const generateDailyBrief = withAgentErrorHandling(
  {
    agentName: 'Brief',
    action: 'generate_daily_brief_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId = null) => {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const withTenant = (query) => (tenantId ? query.eq('tenant_id', tenantId) : query);

  const [
    { count: leadsFound },
    { count: emailsSent },
    { count: replies },
    { count: meetings },
    { data: payments }
  ] = await Promise.all([
    withTenant(supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today)),
    withTenant(supabase.from('outreach_log').select('*', { count: 'exact', head: true }).gte('created_at', today)),
    withTenant(supabase.from('replies').select('*', { count: 'exact', head: true }).gte('created_at', today)),
    withTenant(supabase.from('meetings').select('*', { count: 'exact', head: true }).gte('created_at', today)),
    withTenant(supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', today))
  ]);

  const revenue = (payments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const summary = await callGroq({
    model: MODELS.FAST,
    messages: [
      {
        role: 'user',
        content: `Write a direct 3-sentence daily brief for Jax using this data: ${leadsFound || 0} leads found, ${emailsSent || 0} emails sent, ${replies || 0} replies, ${meetings || 0} meetings booked, $${revenue} revenue.`
      }
    ],
    temperature: 0.3,
    max_tokens: 220
  });

  await supabase.from('daily_reports').upsert(
    {
      date: today,
      tenant_id: tenantId,
      leads_found: leadsFound || 0,
      emails_sent: emailsSent || 0,
      replies_received: replies || 0,
      meetings_booked: meetings || 0,
      revenue,
      summary,
      delivered: false
    },
    {
      onConflict: 'tenant_id,date'
    }
  );

  return {
    leadsFound: leadsFound || 0,
    emailsSent: emailsSent || 0,
    replies: replies || 0,
    meetings: meetings || 0,
    revenue,
    summary
  };
  }
);
