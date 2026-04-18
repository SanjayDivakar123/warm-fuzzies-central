import { runWarmupCycle } from '../../src/agents/outreach/warmup.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Warmup API',
    action: 'warmup_request_failed',
    methods: ['GET', 'POST']
  },
  async (req, res) => {
    const supabase = getServiceSupabase();
    let query = supabase
      .from('inboxes')
      .select('*')
      .eq('active', true);

    if (req.body?.tenantId) {
      query = query.eq('tenant_id', req.body.tenantId);
    }

    const { data: inboxes, error } = await query;

    if (error) {
      throw error;
    }

    const results = await runWarmupCycle(inboxes || []);
    res.status(200).json({ warmed: results.length, results });
  }
);
