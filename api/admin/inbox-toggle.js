import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { requireFields, withApiHandler } from '../../src/lib/api_handler.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';

export default withApiHandler(
  {
    agentName: 'Admin API',
    action: 'admin_inbox_toggle_failed',
    methods: 'POST',
    validate: async (req) => requireFields(req.body || {}, ['inboxId', 'active'])
  },
  async (req, res, body) => {
    requireAdminRequest(req);
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('inboxes')
      .update({ active: Boolean(body.active) })
      .eq('id', body.inboxId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ inbox: data });
  }
);
