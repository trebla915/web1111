import { decideRefund, cancellationRefundIdempotencyKey } from "@/lib/auth/policy";

/**
 * The refund decision sequence, expressed against narrow interfaces so it can
 * be simulated exhaustively — including failure and concurrency cases that
 * cannot be produced against the real Stripe API.
 *
 * The route supplies real Stripe and Firestore adapters; the tests supply fakes.
 * Both run this identical code.
 */

export interface RefundRecord {
  id: string;
  amount: number;
  status: "succeeded" | "pending" | "failed" | "canceled" | "requires_action" | null;
  metadata?: Record<string, string> | null;
}

export interface StripePort {
  /** Settled charge totals, in minor units. */
  getChargeTotals(paymentIntentId: string): Promise<{
    amountCaptured: number;
    amountRefunded: number;
    currency: string;
  }>;
  /** ALL refunds for the intent — the adapter must paginate. */
  listRefunds(paymentIntentId: string): Promise<RefundRecord[]>;
  createRefund(args: {
    paymentIntentId: string;
    amountCents: number;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<RefundRecord>;
}

export type RefundOutcome =
  /**
   * A refund for this cancellation already existed and was reused.
   * `requestedDiffers` is true when the operator asked for a different amount
   * than the one that actually exists — they must be told, not silently given
   * a different number.
   */
  | { kind: "reused"; refund: RefundRecord; requestedDiffers: boolean }
  | { kind: "created"; refund: RefundRecord }
  | { kind: "none" }
  | { kind: "refused"; status: 400 | 409 | 502; reason: string; refundableCents?: number };

/**
 * A refund already belonging to this cancellation.
 *
 * Matched on our own `reservationId` metadata, which only our code writes — so
 * a refund an operator issued directly in the Stripe Dashboard is deliberately
 * NOT matched here. Those are still accounted for, because they raise
 * `amountRefunded` and therefore lower the ceiling.
 *
 * `failed` and `canceled` refunds are ignored: no money moved, so a retry
 * should be allowed to try again. `pending` and `requires_action` DO count —
 * money is in flight and a second attempt would duplicate it.
 */
export function findPriorRefund(
  refunds: RefundRecord[],
  reservationId: string
): RefundRecord | undefined {
  return refunds.find(
    (r) =>
      r.metadata?.reservationId === reservationId &&
      r.status !== "failed" &&
      r.status !== "canceled"
  );
}

export async function executeCancellationRefund(args: {
  stripe: StripePort;
  paymentIntentId: string;
  reservationId: string;
  requestedCents: number;
  actorUid: string;
}): Promise<RefundOutcome> {
  const { stripe, paymentIntentId, reservationId, requestedCents, actorUid } = args;

  if (requestedCents <= 0) return { kind: "none" };

  // 1. What does Stripe already know? An unreadable answer must refuse, never
  //    assume — guessing here is how a customer gets refunded twice.
  let refunds: RefundRecord[];
  let totals: { amountCaptured: number; amountRefunded: number; currency: string };
  try {
    [refunds, totals] = await Promise.all([
      stripe.listRefunds(paymentIntentId),
      stripe.getChargeTotals(paymentIntentId),
    ]);
  } catch {
    return { kind: "refused", status: 502, reason: "Unable to confirm existing refunds with Stripe" };
  }

  // 2. Already refunded for this cancellation? Reuse it. This is what makes
  //    recovery correct after Stripe's 24h idempotency window has passed.
  const prior = findPriorRefund(refunds, reservationId);
  if (prior) {
    return { kind: "reused", refund: prior, requestedDiffers: prior.amount !== requestedCents };
  }

  // 3. Ceiling from Stripe, including refunds made outside this app.
  const decision = decideRefund({
    requestedAmountCents: requestedCents,
    amountCapturedCents: totals.amountCaptured,
    amountAlreadyRefundedCents: totals.amountRefunded,
  });
  if (!decision.ok) {
    return { kind: "refused", status: 400, reason: decision.reason, refundableCents: decision.refundableCents };
  }

  // 4. Create, with the idempotency key as a second line of defence.
  try {
    const refund = await stripe.createRefund({
      paymentIntentId,
      amountCents: decision.amountCents,
      idempotencyKey: cancellationRefundIdempotencyKey(reservationId),
      metadata: { reservationId, actorUid },
    });
    return { kind: "created", refund };
  } catch (error) {
    const type = (error as { type?: string })?.type;
    if (type === "StripeIdempotencyError") {
      return {
        kind: "refused",
        status: 409,
        reason:
          "A refund with different parameters already exists for this reservation. " +
          "Review it in Stripe before retrying.",
      };
    }
    // An uncertain outcome (timeout, connection reset): the refund MAY exist.
    // Refuse, and let a retry re-run step 2, which will find it if it does.
    return { kind: "refused", status: 502, reason: "Refund outcome uncertain — retry to reconcile" };
  }
}
