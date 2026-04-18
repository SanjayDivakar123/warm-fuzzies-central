import { generateDailyBrief } from '../../src/agents/ops/reporter.js';
import { getServiceSupabase } from '../../src/lib/supabase.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Brief API',
    action: 'brief_request_failed',
    methods: ['GET', 'POST']
  },
  async (_req, res) => {
    const supabase = getServiceSupabase();
    const { data: tenants } = await supabase.from('tenants').select('id');
    const reports = [];

    if (!tenants?.length) {
      reports.push(await generateDailyBrief(null));
    } else {
      for (const tenant of tenants) {
        reports.push({
          tenantId: tenant.id,
          ...(await generateDailyBrief(tenant.id))
        });
      }
    }

    res.status(200).json({ ok: true, reports });
  }
);
