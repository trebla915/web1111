import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Client-side Stripe instance
import { loadStripe } from '@stripe/stripe-js';

export const getStripeClient = async () => {
  return await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
};