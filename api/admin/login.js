import { requireFields, withApiHandler } from '../../src/lib/api_handler.js';
import { setAdminSessionCookie, verifyAdminPassword } from '../../src/lib/admin_auth.js';

export default withApiHandler(
  {
    agentName: 'Admin Auth',
    action: 'admin_login_failed',
    methods: 'POST',
    validate: async (req) => requireFields(req.body || {}, ['password'])
  },
  async (req, res, body) => {
    verifyAdminPassword(body.password);
    setAdminSessionCookie(req, res);
    res.status(200).json({ ok: true });
  }
);
