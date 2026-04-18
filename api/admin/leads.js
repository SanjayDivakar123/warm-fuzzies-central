import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { withApiHandler } from '../../src/lib/api_handler.js';
import { listAdminTenants } from '../../src/lib/admin_queries.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';

export default withApiHandler(
  {
    agentName: 'Admin API',
    action: 'admin_leads_failed',
    methods: 'POST'
  },
  async (req, res) => {
    requireAdminRequest(req);
    const { tenantId = null, status = '', source = '' } = req.body || {};
    const supabase = getServiceSupabase();
    const resolvedTenantId = tenantId || null;
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolvedTenantId) {
      query = query.eq('tenant_id', resolvedTenantId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const [{ data: leads, error }, tenants] = await Promise.all([
      query,
      listAdminTenants()
    ]);

    if (error) {
      throw error;
    }

    res.status(200).json({
      leads: leads || [],
      tenants,
      selectedTenantId: tenantId || ''
    });
  }
);
