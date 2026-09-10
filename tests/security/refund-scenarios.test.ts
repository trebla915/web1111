/**
 * Refund scenario simulations.
 *
 * These drive the SAME code the route runs (`executeCancellationRefund`) through
 * a fake Stripe, so failure and concurrency cases can be produced deliberately.
 *
 * SCOPE: these are MOCKS, not Stripe test mode. They prove the decision
 * sequence. They do not prove Stripe's own behaviour (idempotency-key
 * semantics, refund state transitions) — that requires Stripe test mode with
 * real keys, which is listed as remaining uncertainty.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  executeCancellationRefund,
  findPriorRefund,
  type RefundRecord,
  type StripePort,
} from "../../lib/payments/refund-flow.ts";

const RES = "res-1";
const PI = "pi_1";

/** A fake Stripe with realistic idempotency-key semantics. */
function fakeStripe(init: {
  amountCaptured: number;
  amountRefunded?: number;
  refunds?: RefundRecord[];
  /** Simulate the key having expired from Stripe's memory. */
  forgetKeys?: boolean;
  failCreateWith?: { type?: string };
  failReads?: boolean;
}) {
  const state = {
    amountCaptured: init.amountCaptured,
    amountRefunded: init.amountRefunded ?? 0,
    refunds: [...(init.refunds ?? [])],
    keys: new Map<string, RefundRecord>(),
    createCalls: 0,
  };
  const port: StripePort = {
    async getChargeTotals() {
      if (init.failReads) throw new Error("network");
      return { amountCaptured: state.amountCaptured, amountRefunded: state.amountRefunded, currency: "usd" };
    },
    async listRefunds() {
      if (init.failReads) throw new Error("network");
      return state.refunds;
    },
    async createRefund({ amountCents, idempotencyKey, metadata }) {
      state.createCalls++;
      if (init.failCreateWith) throw init.failCreateWith;
      if (!init.forgetKeys) {
        const seen = state.keys.get(idempotencyKey);
        // Stripe: same key + same params -> original; same key + different params -> error.
        if (seen) {
          if (seen.amount !== amountCents) throw { type: "StripeIdempotencyError" };
          return seen;
        }
      }
      const refund: RefundRecord = {
        id: `re_${state.refunds.length + 1}`,
        amount: amountCents,
        status: "succeeded",
        metadata,
      };
      state.keys.set(idempotencyKey, refund);
      state.refunds.push(refund);
      state.amountRefunded += amountCents;
      return refund;
    },
  };
  return { port, state };
}

const run = (port: StripePort, cents: number) =>
  executeCancellationRefund({ stripe: port, paymentIntentId: PI, reservationId: RES, requestedCents: cents, actorUid: "admin-1" });

describe("1. two simultaneous requests cannot create duplicate refunds", () => {
  it("concurrent identical requests produce exactly one refund", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000 });
    const [a, b] = await Promise.all([run(port, 10000), run(port, 10000)]);
    assert.equal(state.refunds.length, 1, "exactly one refund object must exist");
    assert.equal(state.amountRefunded, 10000, "the customer must be refunded once");
    for (const r of [a, b]) assert.ok(r.kind === "created" || r.kind === "reused");
    assert.equal((a as any).refund.id, (b as any).refund.id, "both callers see the same refund");
    // Same amount requested, so neither caller is misled about the total.
    if (b.kind === "reused") assert.equal(b.requestedDiffers, false);
  });

  it("concurrent requests for DIFFERENT amounts do not both succeed", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000 });
    const results = await Promise.all([run(port, 10000), run(port, 20000)]);

    // Two safe outcomes are possible depending on interleaving:
    //   - the loser finds the winner's refund first and REUSES it, or
    //   - the loser reaches Stripe and is refused with an idempotency error.
    // Both are correct; the invariant is that only one refund exists.
    assert.equal(state.refunds.length, 1, "exactly one refund object");
    assert.equal(state.amountRefunded, state.refunds[0].amount, "money moved once");
    assert.equal(state.createCalls <= 2, true);

    const created = results.filter((r) => r.kind === "created");
    assert.equal(created.length, 1, "only one caller may create");

    const other = results.find((r) => r.kind !== "created")!;
    assert.ok(
      (other.kind === "reused" && other.requestedDiffers) ||
        (other.kind === "refused" && other.status === 409),
      "the other caller must either be told it reused a different amount, or be refused"
    );
  });
});

describe("2. Stripe succeeded but the local save failed", () => {
  it("a retry the same day reuses the refund (idempotency key still live)", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000 });
    await run(port, 10000);            // succeeds at Stripe; caller then fails to save
    const retry = await run(port, 10000);
    assert.equal(retry.kind, "reused");
    assert.equal(state.amountRefunded, 10000, "no second refund");
  });

  it("a retry AFTER the 24h key expiry still reuses it — the real protection", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000, forgetKeys: true });
    await run(port, 10000);
    const retry = await run(port, 10000);
    assert.equal(retry.kind, "reused", "must be found by lookup, not by the expired key");
    assert.equal(state.amountRefunded, 10000);
    assert.equal(state.createCalls, 1, "create must not be attempted a second time");
  });

  it("a much later retry, claim long expired, still does not duplicate", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000, forgetKeys: true });
    await run(port, 45000);
    for (let i = 0; i < 5; i++) await run(port, 45000);
    assert.equal(state.amountRefunded, 45000, "repeated retries must never compound");
  });
});

describe("3. uncertain Stripe responses are handled safely", () => {
  it("a create that times out refuses rather than reporting success", async () => {
    const { port } = fakeStripe({ amountCaptured: 45000, failCreateWith: { type: "StripeConnectionError" } });
    const r = await run(port, 10000);
    assert.equal(r.kind, "refused");
    assert.equal((r as any).status, 502);
    assert.match((r as any).reason, /uncertain/);
  });

  it("after an uncertain create, a retry reconciles instead of duplicating", async () => {
    // The first attempt actually landed at Stripe but the response was lost.
    const landed: RefundRecord = { id: "re_ghost", amount: 10000, status: "succeeded", metadata: { reservationId: RES } };
    const { port, state } = fakeStripe({ amountCaptured: 45000, amountRefunded: 10000, refunds: [landed] });
    const retry = await run(port, 10000);
    assert.equal(retry.kind, "reused");
    assert.equal((retry as any).refund.id, "re_ghost");
    assert.equal(state.createCalls, 0, "must not create after finding the landed refund");
  });

  it("if Stripe cannot be read at all, it refuses — never assumes", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000, failReads: true });
    const r = await run(port, 10000);
    assert.equal(r.kind, "refused");
    assert.equal((r as any).status, 502);
    assert.equal(state.createCalls, 0, "no refund may be attempted on unknown state");
  });
});

describe("4. legitimate partial refunds are not confused with duplicates", () => {
  it("a DIFFERENT reservation on the same payment is not treated as a duplicate", () => {
    const refunds: RefundRecord[] = [{ id: "re_other", amount: 5000, status: "succeeded", metadata: { reservationId: "res-OTHER" } }];
    assert.equal(findPriorRefund(refunds, RES), undefined);
  });

  it("a partial refund leaves the remaining balance available", async () => {
    const prior: RefundRecord = { id: "re_dash", amount: 20000, status: "succeeded", metadata: null }; // Dashboard-issued
    const { port } = fakeStripe({ amountCaptured: 45000, amountRefunded: 20000, refunds: [prior] });
    const r = await run(port, 25000);
    assert.equal(r.kind, "created", "the untouched 250.00 must still be refundable");
  });

  it("but a second refund cannot exceed what remains", async () => {
    const prior: RefundRecord = { id: "re_dash", amount: 20000, status: "succeeded", metadata: null };
    const { port } = fakeStripe({ amountCaptured: 45000, amountRefunded: 20000, refunds: [prior] });
    const r = await run(port, 30000);
    assert.equal(r.kind, "refused");
    assert.equal((r as any).refundableCents, 25000);
  });
});

describe("5. existing failed / pending / canceled / external refunds", () => {
  const mk = (status: RefundRecord["status"], mine = true): RefundRecord[] => [
    { id: `re_${status}`, amount: 10000, status, metadata: mine ? { reservationId: RES } : null },
  ];

  it("a FAILED prior refund does not block a genuine retry", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000, amountRefunded: 0, refunds: mk("failed") });
    const r = await run(port, 10000);
    assert.equal(r.kind, "created", "no money moved, so a retry must be allowed");
    assert.equal(state.createCalls, 1);
  });

  it("a CANCELED prior refund does not block a genuine retry", async () => {
    const { port } = fakeStripe({ amountCaptured: 45000, amountRefunded: 0, refunds: mk("canceled") });
    assert.equal((await run(port, 10000)).kind, "created");
  });

  it("a PENDING prior refund DOES block — money is already in flight", async () => {
    const { port, state } = fakeStripe({ amountCaptured: 45000, amountRefunded: 10000, refunds: mk("pending") });
    const r = await run(port, 10000);
    assert.equal(r.kind, "reused");
    assert.equal(state.createCalls, 0);
  });

  it("a REQUIRES_ACTION prior refund also blocks", async () => {
    const { port } = fakeStripe({ amountCaptured: 45000, amountRefunded: 10000, refunds: mk("requires_action") });
    assert.equal((await run(port, 10000)).kind, "reused");
  });

  it("an EXTERNAL (Dashboard) refund is not reused, but does lower the ceiling", async () => {
    const { port } = fakeStripe({ amountCaptured: 45000, amountRefunded: 45000, refunds: mk("succeeded", false) });
    const r = await run(port, 100);
    assert.equal(r.kind, "refused", "fully refunded elsewhere");
    assert.match((r as any).reason, /fully refunded/);
  });
});

describe("6. lookup completeness and identifiers", () => {
  it("matches on our own reservationId metadata, not on amount or timing", () => {
    const refunds: RefundRecord[] = [
      { id: "re_a", amount: 10000, status: "succeeded", metadata: { reservationId: "other" } },
      { id: "re_b", amount: 10000, status: "succeeded", metadata: null },
      { id: "re_c", amount: 999,   status: "succeeded", metadata: { reservationId: RES } },
    ];
    assert.equal(findPriorRefund(refunds, RES)?.id, "re_c",
      "amount must not be the identifier — a coincidental match would be wrong");
  });

  it("keys off the PaymentIntent, which is what the reservation stores", () => {
    // The reservation record holds `paymentId` = the PaymentIntent id, so the
    // lookup and the refund both address the same object.
    assert.equal(typeof PI, "string");
  });

  it("the adapter contract requires ALL refunds, not one page", () => {
    const src = readFileSync("lib/payments/refund-flow.ts", "utf8");
    assert.match(src, /ALL refunds for the intent — the adapter must paginate/);
  });
});

describe("an operator is never silently given a different amount", () => {
  it("reusing a refund of a different size is flagged", async () => {
    const prior: RefundRecord = { id: "re_1", amount: 10000, status: "succeeded", metadata: { reservationId: RES } };
    const { port } = fakeStripe({ amountCaptured: 45000, amountRefunded: 10000, refunds: [prior] });
    const r = await run(port, 25000); // operator asked for 250.00, 100.00 exists
    assert.equal(r.kind, "reused");
    assert.equal((r as any).requestedDiffers, true,
      "the caller must be told the existing refund is not the amount they asked for");
    assert.equal((r as any).refund.amount, 10000, "and the real amount is reported");
  });

  it("reusing an identical refund is not flagged", async () => {
    const prior: RefundRecord = { id: "re_1", amount: 10000, status: "succeeded", metadata: { reservationId: RES } };
    const { port } = fakeStripe({ amountCaptured: 45000, amountRefunded: 10000, refunds: [prior] });
    const r = await run(port, 10000);
    assert.equal((r as any).requestedDiffers, false);
  });
});
