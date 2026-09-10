/**
 * The refund kill switch lets the SECURITY fix ship without the unverified
 * money-moving rewrite.
 *
 * These are source-level assertions on ordering, which is the property that
 * matters: authentication must come first (so an anonymous caller still gets
 * 401), and the switch must come before the database claim and before any
 * Stripe call (so nothing is cancelled or charged while refunds are off).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const route = readFileSync("app/api/reservations/[reservationId]/cancel/route.ts", "utf8");

describe("web refunds are disabled by default", () => {
  it("requires an explicit opt-in, so unset means off", () => {
    assert.match(route, /process\.env\.WEB_REFUNDS_ENABLED === 'true'/,
      "any value other than the exact string 'true' must leave refunds disabled");
  });

  it("returns 503 without moving money", () => {
    assert.match(route, /WEB_REFUNDS_DISABLED/);
    assert.match(route, /status: 503/);
  });
});

describe("ordering — the property that makes this safe", () => {
  const authAt = route.indexOf("await requireRole(request, ADMIN_ROLES");
  const switchAt = route.indexOf("if (!webRefundsEnabled())");
  const claimAt = route.indexOf("adminFirestore.runTransaction");
  const refundAt = route.indexOf("await executeCancellationRefund(");  // the call, not the import

  it("authenticates BEFORE consulting the switch", () => {
    assert.ok(authAt > 0 && switchAt > authAt,
      "an anonymous caller must get 401, not a 503 that reveals the flag");
  });

  it("consults the switch BEFORE claiming the cancellation", () => {
    assert.ok(claimAt > switchAt,
      "no reservation may be marked cancelled while refunds are unavailable");
  });

  it("consults the switch BEFORE any Stripe call", () => {
    assert.ok(refundAt > switchAt,
      "no unverified money-moving code may run while the switch is off");
  });
});

describe("the security fix survives the switch", () => {
  it("still requires an admin role with revocation checking", () => {
    assert.match(route, /requireRole\(request, ADMIN_ROLES, \{ checkRevoked: true \}\)/,
      "closing the anonymous-refund hole is the point of this release");
  });
});
