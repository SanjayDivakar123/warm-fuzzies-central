import { runReactivationCycle } from '../../src/agents/followup/reactivation.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Reactivation API',
    action: 'reactivation_request_failed',
    methods: ['GET', 'POST']
  },
  async (req, res) => {
    const results = await runReactivationCycle(req.body?.tenantId || null);
    res.status(200).json({ ok: true, results });
  }
);
