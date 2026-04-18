import { requireAdminRequest } from '../../src/lib/admin_auth.js';
import { requireFields, withApiHandler } from '../../src/lib/api_handler.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';

export default withApiHandler(
  {
    agentName: 'Admin API',
    action: 'admin_lead_detail_failed',
    methods: 'POST',
    validate: async (req) => requireFields(req.body || {}, ['leadId'])
  },
  async (_req, res, body) => {
    requireAdminRequest(_req);
    const supabase = getServiceSupabase();
    const leadId = body.leadId;

    const [
      { data: lead, error: leadError },
      { data: outreachHistory, error: outreachError },
      { data: replies, error: repliesError },
      { data: meetings, error: meetingsError },
      { data: proposals, error: proposalsError },
      { data: payments, error: paymentsError }
    ] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('outreach_log').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
      supabase.from('replies').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
      supabase.from('meetings').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
      supabase.from('proposals').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
    ]);

    for (const error of [leadError, outreachError, repliesError, meetingsError, proposalsError, paymentsError]) {
      if (error) {
        throw error;
      }
    }

    res.status(200).json({
      lead,
      outreachHistory: outreachHistory || [],
      replies: replies || [],
      meetings: meetings || [],
      proposals: proposals || [],
      payments: payments || []
    });
  }
);
