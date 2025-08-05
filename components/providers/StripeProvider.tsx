"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  // Only wrap with Elements if clientSecret is provided
  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        {children}
      </Elements>
    );
  }

  // Otherwise just render children without Elements wrapper
  return <>{children}</>;
}