import { runFollowUpCycle } from '../../src/agents/followup/sequence.js';
import { withApiHandler } from '../../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Followup API',
    action: 'followup_request_failed',
    methods: ['GET', 'POST']
  },
  async (req, res) => {
    const results = await runFollowUpCycle(req.body?.tenantId || null);
    res.status(200).json({ ok: true, results });
  }
);
