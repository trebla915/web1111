/**
 * Refund correctness — currency units, balance derivation, and the exact
 * concurrency/retry scenarios, including the ones idempotency does NOT cover.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  CLAIM_STALE_AFTER_MS,
  cancellationRefundIdempotencyKey,
  decideRefund,
  dollarsToCents,
} from "../../lib/auth/policy.ts";

describe("currency units", () => {
  it("converts clean money values to integer cents", () => {
    assert.equal(dollarsToCents(450), 45000);
    assert.equal(dollarsToCents(45.67), 4567);
    assert.equal(dollarsToCents(0.01), 1);
    assert.equal(dollarsToCents(1234.5), 123450);
  });

  it("survives binary-float representation", () => {
    // 45.67 * 100 === 4566.999999999999 in IEEE-754.
    assert.equal(dollarsToCents(45.67), 4567);
    assert.equal(dollarsToCents(19.99), 1999);
    assert.equal(dollarsToCents(0.29), 29);
  });

  it("refuses sub-cent precision rather than silently rounding money", () => {
    assert.equal(dollarsToCents(10.005), null);
    assert.equal(dollarsToCents(0.001), null);
  });

  it("refuses non-money input", () => {
    for (const bad of [0, -1, NaN, Infinity, "45", null, undefined, {}]) {
      assert.equal(dollarsToCents(bad), null, `${JSON.stringify(bad)} must be refused`);
    }
  });
});

describe("refundable balance is derived from Stripe", () => {
  it("accounts for refunds created OUTSIDE this application", () => {
    // charge.amount_refunded includes Dashboard/API refunds, so a $200
    // Dashboard refund correctly shrinks what this route will allow.
    const d = decideRefund({
      requestedAmountCents: 30000,
      amountCapturedCents: 45000,
      amountAlreadyRefundedCents: 20000, // issued in the Stripe Dashboard
    });
    assert.equal(d.ok, false);
    assert.equal((d as any).refundableCents, 25000);
  });

  it("permits exactly the remaining balance after an external refund", () => {
    assert.deepEqual(
      decideRefund({ requestedAmountCents: 25000, amountCapturedCents: 45000, amountAlreadyRefundedCents: 20000 }),
      { ok: true, amountCents: 25000 }
    );
  });

  it("refuses when an external refund already cleared the balance", () => {
    const d = decideRefund({ requestedAmountCents: 100, amountCapturedCents: 45000, amountAlreadyRefundedCents: 45000 });
    assert.equal(d.ok, false);
    assert.match((d as any).reason, /fully refunded/);
  });

  it("never trusts a caller-supplied ceiling", () => {
    // Only captured/refunded feed the decision; there is no parameter through
    // which a caller could raise the ceiling.
    const d = decideRefund({ requestedAmountCents: 999999, amountCapturedCents: 100, amountAlreadyRefundedCents: 0 });
    assert.equal(d.ok, false);
    assert.equal((d as any).refundableCents, 100);
  });
});

describe("idempotency key — what it does and does not cover", () => {
  it("COVERS: a client retry of the same refund reuses the key", () => {
    assert.equal(
      cancellationRefundIdempotencyKey("res-1"),
      cancellationRefundIdempotencyKey("res-1"),
      "Stripe returns the original refund instead of creating a second"
    );
  });

  it("COVERS: distinct reservations never share a key", () => {
    assert.notEqual(cancellationRefundIdempotencyKey("res-1"), cancellationRefundIdempotencyKey("res-2"));
  });

  it("DOES NOT COVER: two different partial refunds on one reservation", () => {
    // Both would present the same key with different amounts, which Stripe
    // rejects with StripeIdempotencyError. The route surfaces that as 409 with
    // a distinct message rather than a generic failure. This route deliberately
    // supports ONE refund per cancellation; staged partial refunds are a
    // separate workflow (business decision D-3).
    const first = cancellationRefundIdempotencyKey("res-1");
    const second = cancellationRefundIdempotencyKey("res-1");
    assert.equal(first, second);
  });

  it("DOES NOT COVER: a retry after Stripe's 24h idempotency window", () => {
    // The key is stable forever, but Stripe only remembers it for 24 hours.
    // After that the same key would create a SECOND refund — which is why the
    // database claim, not the key, is the primary concurrency guard.
    assert.equal(cancellationRefundIdempotencyKey("res-1"), "reservation-cancel-refund:res-1");
  });

  it("claim staleness is bounded so a crash cannot lock a booking forever", () => {
    assert.ok(CLAIM_STALE_AFTER_MS > 30_000, "must outlast a slow Stripe call");
    assert.ok(CLAIM_STALE_AFTER_MS <= 5 * 60_000, "must not block an operator for long");
  });
});

describe("concurrency model is layered, not key-only", () => {
  const route = readFileSync("app/api/reservations/[reservationId]/cancel/route.ts", "utf8");
  const flow = readFileSync("lib/payments/refund-flow.ts", "utf8");

  it("claims the cancellation in a transaction BEFORE calling Stripe", () => {
    const claimAt = route.indexOf("runTransaction");
    const refundAt = route.indexOf("executeCancellationRefund(");
    assert.ok(claimAt !== -1 && refundAt !== -1);
    assert.ok(claimAt < refundAt,
      "money must not move before the database has granted exclusive rights to cancel");
  });

  it("releases the claim on every path that returns after claiming", () => {
    // Two mechanisms, together covering all exits:
    //   - the explicit release on the refund-refused branch
    //   - a catch-all in the error handler, guarded by `claimed`
    assert.match(route, /if \(outcome\.kind === 'refused'\)[\s\S]{0,200}await releaseClaim/,
      "a refused refund must release the claim");
    assert.match(route, /catch \(error\) \{\s*\n\s*if \(claimed\) await releaseClaim/,
      "any thrown error after claiming must release the claim");
    // And the happy path clears it as part of finalisation.
    assert.match(route, /cancellationClaimedAt: null/);
    assert.match(route, /claimed = false;/);
  });

  it("handles StripeIdempotencyError distinctly from a generic failure", () => {
    assert.match(flow, /StripeIdempotencyError/);
    assert.match(flow, /different parameters already exists/);
  });

  it("does not return raw Stripe error text to the caller", () => {
    assert.doesNotMatch(route, /stripeError\.message|err\.message/);
    assert.doesNotMatch(flow, /error\.message/);
  });

  it("records an audit row with the verified actor", () => {
    assert.match(route, /recordAudit/);
    assert.match(route, /actorUid: actor\.uid/);
  });

  it("mirror-write failure does not mask a successful refund", () => {
    const mirrorAt = route.indexOf("collection('refunds')");
    const finaliseAt = route.indexOf("status: 'cancelled'");
    assert.ok(finaliseAt < mirrorAt,
      "the reservation must be finalised before best-effort bookkeeping");
  });

  it("tells the operator when a reused refund differs from what they asked for", () => {
    assert.match(route, /amountDifferedFromRequest/);
    assert.match(route, /An earlier refund already existed/);
  });
});

describe("recovery when Stripe succeeds but the database does not", () => {
  const route = readFileSync("lib/payments/refund-flow.ts", "utf8");

  it("asks Stripe what already exists BEFORE creating a refund", () => {
    const listAt = route.indexOf("listRefunds");
    const createAt = route.indexOf("createRefund");
    assert.ok(listAt !== -1, "must enumerate existing refunds");
    assert.ok(listAt < createAt, "the existence check must precede creation");
  });

  it("matches a prior refund by reservation id in Stripe metadata", () => {
    assert.match(route, /metadata\?\.reservationId === reservationId/);
  });

  it("ignores failed and cancelled refunds when deciding one already exists", () => {
    assert.match(route, /r\.status !== "failed"/);
    assert.match(route, /r\.status !== "canceled"/);
  });

  it("refuses rather than guesses if Stripe cannot be enumerated", () => {
    assert.match(route, /Unable to confirm existing refunds/);
    // Refusing is the safe failure mode: a duplicate refund is unrecoverable
    // without contacting the customer, a refused retry is not.
  });

  it("only creates a refund when no prior one was found", () => {
    const priorAt = route.indexOf("if (prior)");
    const createAt = route.indexOf("stripe.createRefund");
    assert.ok(priorAt !== -1 && priorAt < createAt,
      "the early return on a prior refund must precede creation");
  });

  it("survives the 24h idempotency-key expiry", () => {
    // The durable record is the refund object in Stripe, not the key.
    assert.ok(route.indexOf("listRefunds") < route.indexOf("createRefund"));
  });
});

describe("claim expiry does not enable a double refund", () => {
  const route = readFileSync("app/api/reservations/[reservationId]/cancel/route.ts", "utf8");
  const flow = readFileSync("lib/payments/refund-flow.ts", "utf8");

  it("a stale claim lets a second operator proceed", () => {
    assert.match(route, /CLAIM_STALE_AFTER_MS/);
    assert.match(route, /cancellation is already in progress/);
  });

  it("but the existence check still prevents a second refund", () => {
    // Operator B, arriving after the claim goes stale, finds A's refund in
    // Stripe and reuses it rather than creating another. Demonstrated live in
    // the scenario suite, not just asserted here.
    assert.ok(flow.indexOf("listRefunds") < flow.indexOf("createRefund"));
    assert.match(route, /reused an existing refund/);
  });
});
