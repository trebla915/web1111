// components/StripeProvider.tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function StripeProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    throw new Error("Missing Stripe public key in .env");
  }
  
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}