import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { withApiHandler } from '../../src/lib/api_handler.js';
import { getDateFloor, listAdminTenants } from '../../src/lib/admin_queries.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';

export default withApiHandler(
  {
    agentName: 'Admin API',
    action: 'admin_overview_failed',
    methods: 'POST'
  },
  async (req, res) => {
    requireAdminRequest(req);
    const { tenantId = null } = req.body || {};
    const supabase = getServiceSupabase();
    const withTenant = (query) => (tenantId ? query.eq('tenant_id', tenantId) : query);

    const [
      { data: leadStatuses, error: leadsError },
      { count: emailsToday, error: todayError },
      { count: emailsWeek, error: weekError },
      { count: emailsMonth, error: monthError },
      { count: totalReplies, error: repliesError },
      { count: totalEmails, error: totalEmailsError },
      { count: meetingsBooked, error: meetingsError },
      { data: paidPayments, error: paymentsError },
      { data: recentActivity, error: activityError },
      tenants
    ] = await Promise.all([
      withTenant(supabase.from('leads').select('status')),
      withTenant(supabase.from('outreach_log').select('*', { count: 'exact', head: true }).eq('channel', 'email').gte('created_at', getDateFloor('today'))),
      withTenant(supabase.from('outreach_log').select('*', { count: 'exact', head: true }).eq('channel', 'email').gte('created_at', getDateFloor('week'))),
      withTenant(supabase.from('outreach_log').select('*', { count: 'exact', head: true }).eq('channel', 'email').gte('created_at', getDateFloor('month'))),
      withTenant(supabase.from('replies').select('*', { count: 'exact', head: true })),
      withTenant(supabase.from('outreach_log').select('*', { count: 'exact', head: true }).eq('channel', 'email')),
      withTenant(supabase.from('meetings').select('*', { count: 'exact', head: true })),
      withTenant(supabase.from('payments').select('amount').eq('status', 'paid')),
      withTenant(supabase.from('agent_log').select('*').order('created_at', { ascending: false }).limit(50)),
      listAdminTenants()
    ]);

    for (const error of [leadsError, todayError, weekError, monthError, repliesError, totalEmailsError, meetingsError, paymentsError, activityError]) {
      if (error) {
        throw error;
      }
    }

    const stageCounts = (leadStatuses || []).reduce((accumulator, lead) => {
      const key = lead.status || 'unknown';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const revenueClosed = (paidPayments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const replyRate = (totalEmails || 0) > 0 ? Number((((totalReplies || 0) / totalEmails) * 100).toFixed(1)) : 0;

    res.status(200).json({
      stageCounts,
      emails: {
        today: emailsToday || 0,
        week: emailsWeek || 0,
        month: emailsMonth || 0
      },
      replies: {
        total: totalReplies || 0,
        rate: replyRate
      },
      meetingsBooked: meetingsBooked || 0,
      revenueClosed,
      recentActivity: recentActivity || [],
      tenants
    });
  }
);
