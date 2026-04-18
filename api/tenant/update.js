import { updateTenantConfig } from '../../src/lib/tenant.js';
import { requireFields, withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Tenant API',
    action: 'tenant_update_failed',
    methods: 'POST',
    validate: async (req) => requireFields(req.body || {}, ['tenantId']),
    getErrorContext: (req) => ({
      tenantId: req.body?.tenantId || null
    })
  },
  async (_req, res, body) => {
    const { tenantId, ...payload } = body;
    const tenant = await updateTenantConfig(tenantId, payload);
    res.status(200).json({ tenant });
  }
);
