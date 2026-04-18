import { analyzeABResults } from '../../src/agents/outreach/ab_tester.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'AB API',
    action: 'ab_analysis_request_failed',
    methods: ['GET', 'POST']
  },
  async (req, res) => {
    const report = await analyzeABResults(req.body?.tenantId || null);
    res.status(200).json({ ok: true, report });
  }
);
