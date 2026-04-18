import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { withApiHandler } from '../../src/lib/api_handler.js';
import { listAdminTenants } from '../../src/lib/admin_queries.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';

export default withApiHandler(
  {
    agentName: 'Admin API',
    action: 'admin_logs_failed',
    methods: 'POST'
  },
  async (req, res) => {
    requireAdminRequest(req);
    const { tenantId = null, agentName = '', page = 1 } = req.body || {};
    const supabase = getServiceSupabase();
    const pageSize = 50;
    const from = (Math.max(1, Number(page) || 1) - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('agent_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (agentName) {
      query = query.eq('agent_name', agentName);
    }

    const [{ data, error, count }, tenants] = await Promise.all([
      query,
      listAdminTenants()
    ]);

    if (error) {
      throw error;
    }

    res.status(200).json({
      logs: data || [],
      total: count || 0,
      page: Math.max(1, Number(page) || 1),
      pageSize,
      tenants
    });
  }
);
