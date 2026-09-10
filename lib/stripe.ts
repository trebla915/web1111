import "server-only";

import Stripe from "stripe";

/**
 * The one server-side Stripe client.
 *
 * Six route handlers each constructed their own, and they had drifted: the
 * webhook was pinned to `2024-04-10` while the five reservation routes declared
 * `2024-06-20`, so webhook payloads and API responses were being read against
 * different API versions. `2024-04-10` is what the installed SDK (stripe@15)
 * types support.
 *
 * Bumping the API version is now a one-line change here, and it cannot drift
 * between the webhook and the routes it verifies.
 */
const STRIPE_API_VERSION = "2024-04-10" as const;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: STRIPE_API_VERSION,
});
