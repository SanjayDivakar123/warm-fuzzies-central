import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { requireFields, withApiHandler } from '../../src/lib/api_handler.js';
import { listAdminTenants, resolveAdminTenantId } from '../../src/lib/admin_queries.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';

export default withApiHandler(
  {
    agentName: 'Admin API',
    action: 'admin_settings_failed',
    methods: ['GET', 'POST']
  },
  async (req, res) => {
    requireAdminRequest(req);
    const supabase = getServiceSupabase();

    if (req.method === 'GET') {
      const tenantId = await resolveAdminTenantId(req.query?.tenantId || null);
      const [tenants, tenantResponse] = await Promise.all([
        listAdminTenants(),
        tenantId
          ? supabase.from('tenants').select('*').eq('id', tenantId).single()
          : Promise.resolve({ data: null, error: null })
      ]);

      if (tenantResponse.error) {
        throw tenantResponse.error;
      }

      res.status(200).json({
        tenant: tenantResponse.data,
        tenants,
        selectedTenantId: tenantId
      });
      return;
    }

    const body = requireFields(req.body || {}, ['tenantId', 'icp_description', 'brand_voice', 'calendly_url']);
    const { data, error } = await supabase
      .from('tenants')
      .update({
        icp_description: body.icp_description,
        brand_voice: body.brand_voice,
        calendly_url: body.calendly_url
      })
      .eq('id', body.tenantId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ tenant: data });
  }
);
