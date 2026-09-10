/**
 * Authorization regression tests.
 *
 * Run with Node's built-in runner — no new dependency is added to the project:
 *   node --test tests/security/
 *
 * These exercise the real decision functions used by every route guard
 * (`lib/auth/policy.ts`), not a re-implementation of them.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cancellationRefundIdempotencyKey,
  decideAuthenticated,
  decideOwnerOrRole,
  decideRefund,
  decideRole,
  normalizeRole,
} from "../../lib/auth/policy.ts";

const anon = null;
const customer = { uid: "user-1", role: "user" as const };
const otherCustomer = { uid: "user-2", role: "user" as const };
const staff = { uid: "staff-1", role: "staff" as const };
const admin = { uid: "admin-1", role: "admin" as const };

const ADMIN_ONLY = ["admin"] as const;
const STAFF_UP = ["admin", "promoter", "staff"] as const;

describe("anonymous callers", () => {
  it("cannot reach an authenticated-only operation", () => {
    assert.deepEqual(decideAuthenticated(anon), {
      allow: false, status: 401, reason: "Authentication required",
    });
  });

  it("cannot reach an admin operation", () => {
    assert.equal(decideRole(anon, [...ADMIN_ONLY]).allow, false);
    assert.equal((decideRole(anon, [...ADMIN_ONLY]) as any).status, 401);
  });

  it("cannot reach an owner-scoped operation even by naming the owner", () => {
    // The uid is never taken from the request, so there is nothing to assert.
    assert.equal(decideOwnerOrRole(anon, "user-1", [...ADMIN_ONLY]).allow, false);
  });
});

describe("regular users cannot perform admin actions", () => {
  it("is refused an admin-only operation with 403, not 401", () => {
    const d = decideRole(customer, [...ADMIN_ONLY]);
    assert.equal(d.allow, false);
    assert.equal((d as any).status, 403); // identity proven, permission denied
  });

  it("is refused a staff-only operation", () => {
    assert.equal(decideRole(customer, [...STAFF_UP]).allow, false);
  });

  it("cannot self-elevate by sending a role claim the token does not carry", () => {
    // normalizeRole is the only path from a token claim to a Role.
    assert.equal(normalizeRole("admin'--"), "user");
    assert.equal(normalizeRole({ role: "admin" }), "user");
    assert.equal(normalizeRole(undefined), "user");
    assert.equal(normalizeRole("ADMIN"), "user"); // case-sensitive on purpose
    assert.equal(normalizeRole("admin"), "admin");
  });
});

describe("cross-user access", () => {
  it("lets a user reach their own reservation", () => {
    assert.equal(decideOwnerOrRole(customer, "user-1", [...STAFF_UP]).allow, true);
  });

  it("refuses a user another customer's reservation", () => {
    const d = decideOwnerOrRole(otherCustomer, "user-1", [...STAFF_UP]);
    assert.equal(d.allow, false);
    assert.equal((d as any).status, 403);
  });

  it("lets staff reach any reservation", () => {
    assert.equal(decideOwnerOrRole(staff, "user-1", [...STAFF_UP]).allow, true);
  });

  it("does not treat an ownerless record as owned by anyone", () => {
    assert.equal(decideOwnerOrRole(customer, null, [...ADMIN_ONLY]).allow, false);
    assert.equal(decideOwnerOrRole(customer, undefined, [...ADMIN_ONLY]).allow, false);
    assert.equal(decideOwnerOrRole(customer, "", [...ADMIN_ONLY]).allow, false);
  });

  it("does not let an empty uid match an empty owner", () => {
    assert.equal(decideOwnerOrRole({ uid: "", role: "user" }, "", [...ADMIN_ONLY]).allow, false);
  });
});

describe("legitimate admin workflows still work", () => {
  it("admin passes admin-only", () => {
    assert.deepEqual(decideRole(admin, [...ADMIN_ONLY]), { allow: true });
  });
  it("admin passes staff-scoped", () => {
    assert.deepEqual(decideRole(admin, [...STAFF_UP]), { allow: true });
  });
  it("staff passes staff-scoped but not admin-only", () => {
    assert.equal(decideRole(staff, [...STAFF_UP]).allow, true);
    assert.equal(decideRole(staff, [...ADMIN_ONLY]).allow, false);
  });
});

describe("refund sizing", () => {
  const captured = 45000; // $450.00

  it("allows a partial refund within the balance", () => {
    assert.deepEqual(
      decideRefund({ requestedAmountCents: 10000, amountCapturedCents: captured, amountAlreadyRefundedCents: 0 }),
      { ok: true, amountCents: 10000 }
    );
  });

  it("allows refunding the exact remaining balance", () => {
    assert.deepEqual(
      decideRefund({ requestedAmountCents: 20000, amountCapturedCents: captured, amountAlreadyRefundedCents: 25000 }),
      { ok: true, amountCents: 20000 }
    );
  });

  it("refuses more than was captured", () => {
    const d = decideRefund({ requestedAmountCents: 50000, amountCapturedCents: captured, amountAlreadyRefundedCents: 0 });
    assert.equal(d.ok, false);
    assert.equal((d as any).refundableCents, 45000);
  });

  it("refuses a second refund that would exceed the remainder", () => {
    const d = decideRefund({ requestedAmountCents: 30000, amountCapturedCents: captured, amountAlreadyRefundedCents: 25000 });
    assert.equal(d.ok, false);
    assert.equal((d as any).refundableCents, 20000);
  });

  it("refuses any refund once fully refunded", () => {
    const d = decideRefund({ requestedAmountCents: 1, amountCapturedCents: captured, amountAlreadyRefundedCents: captured });
    assert.equal(d.ok, false);
    assert.match((d as any).reason, /already been fully refunded/);
  });

  it("refuses zero, negative, fractional and non-finite amounts", () => {
    for (const amount of [0, -1, -45000, 10.5, NaN, Infinity]) {
      assert.equal(
        decideRefund({ requestedAmountCents: amount, amountCapturedCents: captured, amountAlreadyRefundedCents: 0 }).ok,
        false,
        `expected ${amount} to be refused`
      );
    }
  });
});

describe("duplicate / concurrent refund safety", () => {
  it("derives one stable idempotency key per reservation", () => {
    const a = cancellationRefundIdempotencyKey("res-123");
    const b = cancellationRefundIdempotencyKey("res-123");
    assert.equal(a, b, "retries must reuse the same key so Stripe returns the original refund");
  });

  it("does not collide across reservations", () => {
    assert.notEqual(
      cancellationRefundIdempotencyKey("res-123"),
      cancellationRefundIdempotencyKey("res-124")
    );
  });
});
