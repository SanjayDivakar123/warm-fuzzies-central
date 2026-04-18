import Stripe from 'stripe';
import { requireEnv } from './env.js';

let stripeClient;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
  }

  return stripeClient;
}
