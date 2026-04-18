import Stripe from 'stripe';
import { provisionAccess } from '../../src/agents/close/provisioner.js';
import { badRequest, withApiHandler } from '../../src/lib/api_handler.js';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default withApiHandler(
  {
    agentName: 'Stripe Webhook',
    action: 'stripe_webhook_failed',
    methods: 'POST',
    validate: async (req) => {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        throw badRequest('Missing required header: stripe-signature');
      }
      return { signature };
    }
  },
  async (req, res, { signature }) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : await getRawBody(req);
    let event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      throw badRequest(`Invalid Stripe signature: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data.object;
      const leadId = session.metadata?.lead_id;
      const tenantId = session.metadata?.tenant_id;

      if (!leadId) {
        throw badRequest('Stripe event metadata missing lead_id');
      }

      await provisionAccess(leadId, session.id, tenantId);
    }

    res.status(200).json({ received: true });
  }
);

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
