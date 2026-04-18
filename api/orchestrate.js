import { runOrchestrationCycle } from '../src/agents/atlas/index.js';
import { withApiHandler } from '../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Atlas API',
    action: 'orchestrate_request_failed',
    methods: 'POST',
    getErrorContext: (req) => ({
      tenantId: req.body?.tenantId || null
    })
  },
  async (req, res) => {
    const results = await runOrchestrationCycle(req.body?.limit || 50, req.body?.tenantId || null);
    res.status(200).json({ ok: true, results });
  }
);
