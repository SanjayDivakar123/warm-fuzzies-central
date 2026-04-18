import { handleGmailCallback } from '../../../src/lib/gmail_oauth.js';
import { requireFields, withApiHandler } from '../../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Gmail OAuth',
    action: 'gmail_callback_failed',
    methods: 'GET',
    validate: async (req) => requireFields(req.query || {}, ['code', 'state'], 'query'),
    getErrorContext: (req) => ({
      tenantId: req.query?.state || null
    })
  },
  async (_req, res, query) => {
    const tenantId = query.state;
    const email = await handleGmailCallback(query.code, tenantId);
    res.redirect(`/?tenant_id=${tenantId}&onboarding=false&inbox_connected=${encodeURIComponent(email)}`);
  }
);
