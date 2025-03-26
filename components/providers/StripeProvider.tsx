"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function StripeProvider({ children }: { children: ReactNode }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}