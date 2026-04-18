import { ensureTenant } from '../../src/lib/tenant.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Tenant API',
    action: 'tenant_bootstrap_failed',
    methods: ['GET', 'POST']
  },
  async (_req, res) => {
    const tenant = await ensureTenant(null);
    const supabase = getServiceSupabase();
    const { count: inboxCount } = await supabase
      .from('inboxes')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('active', true);

    const needsOnboarding =
      tenant.company_name === 'Demo Workspace' ||
      !tenant.icp_description ||
      !tenant.brand_voice ||
      (inboxCount || 0) === 0;

    res.status(200).json({ tenant, needsOnboarding });
  }
);
