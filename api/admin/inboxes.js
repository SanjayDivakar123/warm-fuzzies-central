import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { withApiHandler } from '../../src/lib/api_handler.js';
import { listAdminTenants } from '../../src/lib/admin_queries.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';
import { getInboxLimits, getWarmupCountToday } from '../../src/agents/outreach/warmup.js';

export default withApiHandler(
  {
    agentName: 'Admin API',
    action: 'admin_inboxes_failed',
    methods: 'POST'
  },
  async (req, res) => {
    requireAdminRequest(req);
    const { tenantId = null } = req.body || {};
    const supabase = getServiceSupabase();
    const resolvedTenantId = tenantId || null;

    let query = supabase
      .from('inboxes')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolvedTenantId) {
      query = query.eq('tenant_id', resolvedTenantId);
    }

    const [{ data: inboxes, error }, tenants] = await Promise.all([
      query,
      listAdminTenants()
    ]);

    if (error) {
      throw error;
    }

    const hydratedInboxes = await Promise.all(
      (inboxes || []).map(async (inbox) => {
        const todayWarmupCount = await getWarmupCountToday(inbox.email).catch(() => 0);
        const limits = getInboxLimits(inbox.warmup_phase);
        return {
          ...inbox,
          todayWarmupCount,
          warmupLimit: limits.warmupPerDay,
          warmupProgressPercent: limits.warmupPerDay > 0
            ? Math.min(100, Math.round((todayWarmupCount / limits.warmupPerDay) * 100))
            : 0
        };
      })
    );

    res.status(200).json({
      inboxes: hydratedInboxes,
      tenants,
      selectedTenantId: tenantId || ''
    });
  }
);
