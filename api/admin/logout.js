import { requireAdminRequest, clearAdminSessionCookie } from '../../src/lib/admin_auth.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Admin Auth',
    action: 'admin_logout_failed',
    methods: 'POST'
  },
  async (req, res) => {
    requireAdminRequest(req);
    clearAdminSessionCookie(req, res);
    res.status(200).json({ ok: true });
  }
);
