import { getServiceSupabase } from '../../src/lib/supabase.js';
import { requireFields, withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Tenant API',
    action: 'tenant_dashboard_failed',
    methods: 'POST',
    validate: async (req) => requireFields(req.body || {}, ['tenantId']),
    getErrorContext: (req) => ({
      tenantId: req.body?.tenantId || null
    })
  },
  async (_req, res, body) => {
    const { tenantId } = body;
    const supabase = getServiceSupabase();
    const [{ data: leads }, { data: payments }, { data: activity }, { data: tenant }, { count: inboxCount }] = await Promise.all([
      supabase.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(200),
      supabase.from('payments').select('amount').eq('tenant_id', tenantId).eq('status', 'paid'),
      supabase.from('agent_log').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20),
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
      supabase.from('inboxes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true)
    ]);

    res.status(200).json({
      tenant,
      needsOnboarding:
        !tenant?.company_name ||
        tenant?.company_name === 'Demo Workspace' ||
        !tenant?.icp_description ||
        !tenant?.brand_voice ||
        (inboxCount || 0) === 0,
      leads: leads || [],
      recentActivity: activity || [],
      revenue: (payments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0)
    });
  }
);
