import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Admin Auth',
    action: 'admin_session_failed',
    methods: 'GET'
  },
  async (req, res) => {
    requireAdminRequest(req);
    res.status(200).json({ ok: true, authenticated: true });
  }
);
