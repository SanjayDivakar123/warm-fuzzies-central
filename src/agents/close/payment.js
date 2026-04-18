import { getStripe } from '../../lib/stripe.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { getServiceSupabase } from '../../lib/supabase.js';

export const sendPaymentLink = withAgentErrorHandling(
  {
    agentName: 'Finn',
    action: 'send_payment_link_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, amount) => {
  const stripe = getStripe();
  const supabase = getServiceSupabase();
  const appUrl = process.env.VERCEL_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'OutreachOS - Team License' },
          unit_amount: amount * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/proposal`,
    metadata: {
      lead_id: lead.id,
      tenant_id: lead.tenant_id || ''
    }
  });

  await supabase.from('payments').insert({
    lead_id: lead.id,
    tenant_id: lead.tenant_id || null,
    stripe_session_id: session.id,
    amount,
    status: 'pending'
  });

  return session.url;
  }
);
