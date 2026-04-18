import { getGmailAuthUrl } from '../../../src/lib/gmail_oauth.js';
import { requireFields, withApiHandler } from '../../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Gmail OAuth',
    action: 'gmail_connect_failed',
    methods: 'GET',
    validate: async (req) => requireFields(req.query || {}, ['tenant_id'], 'query'),
    getErrorContext: (req) => ({
      tenantId: req.query?.tenant_id || null
    })
  },
  async (_req, res, query) => {
    const url = getGmailAuthUrl(query.tenant_id);
    res.redirect(url);
  }
);
