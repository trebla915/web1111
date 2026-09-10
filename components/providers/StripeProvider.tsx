"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode } from "react";

import { stripeAppearance } from "@/lib/theme/stripe";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  // Only wrap with Elements if clientSecret is provided
  if (clientSecret) {
    return (
      // `appearance` belongs on Elements, not on PaymentElement. It was
      // previously passed to <PaymentElement options>, where Stripe ignores it —
      // so the payment form rendered in Stripe's stock theme rather than the
      // venue's. Setting it here is what actually applies the design tokens.
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance() }}>
        {children}
      </Elements>
    );
  }

  // Otherwise just render children without Elements wrapper
  return <>{children}</>;
}