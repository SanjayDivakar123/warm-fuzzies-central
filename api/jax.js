import { jax } from '../src/agents/jax/index.js';
import { badRequest, requireFields, withApiHandler } from '../src/lib/api_handler.js';

export default withApiHandler(
  {
    agentName: 'Jax API',
    action: 'jax_request_failed',
    methods: 'POST',
    validate: async (req) => {
      const body = req.body || {};
      requireFields(body, ['message']);
      if (body.history !== undefined && !Array.isArray(body.history)) {
        throw badRequest('history must be an array when provided');
      }
      return body;
    },
    getErrorContext: (req) => ({
      tenantId: req.body?.tenantId || null
    })
  },
  async (_req, res, body) => {
    const { message, history = [], tenantId = null } = body;
    const reply = await jax(message, history, tenantId);
    res.status(200).json({ reply });
  }
);
