/**
 * Route authorization policy — the regression net.
 *
 * Every API handler must appear in EXPECTED with the access level it is meant
 * to have. A new route, or a new method on an existing route, fails this test
 * until someone states its policy — which is exactly how 36 of 41 handlers came
 * to be unauthenticated in the first place.
 *
 *   node --test tests/security/
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

type Level = "PUBLIC" | "AUTHED" | "OWNER" | "SELF" | "STAFF" | "ADMIN" | "STRIPE_SIGNATURE";

/**
 * PUBLIC is deliberate, not an oversight:
 *  - browsing events / tables / bottles / catalogue is how customers shop
 *  - contact + newsletter are unauthenticated forms (rate limiting is a
 *    separate finding, S-10, not an authorization gap)
 *  - sitemap is consumed by crawlers
 */
const EXPECTED: Record<string, Partial<Record<string, Level>>> = {
  "auth/check":                                            { GET: "AUTHED" },
  "auth/me":                                               { GET: "AUTHED" },
  "catalog":                                               { GET: "PUBLIC", POST: "ADMIN" },
  "catalog/[bottleId]":                                    { GET: "PUBLIC", PUT: "ADMIN", DELETE: "ADMIN" },
  "catalog/[bottleId]/upload":                             { POST: "ADMIN" },
  "contact":                                               { POST: "PUBLIC" },
  "events":                                                { GET: "PUBLIC", POST: "ADMIN" },
  "events/[id]":                                           { GET: "PUBLIC", PUT: "ADMIN", DELETE: "ADMIN" },
  "events/[id]/tables":                                    { GET: "PUBLIC", POST: "ADMIN" },
  "events/[id]/tables/[tableId]":                          { GET: "PUBLIC", PUT: "ADMIN", DELETE: "ADMIN" },
  "events/[id]/bottles":                                   { GET: "PUBLIC", POST: "ADMIN" },
  "events/[id]/bottles/[bottleId]":                        { GET: "PUBLIC", PUT: "ADMIN", DELETE: "ADMIN" },
  "newsletter/subscribe":                                  { POST: "PUBLIC" },
  "notifications/register-token":                          { POST: "AUTHED" },
  "notifications/save-push-token":                         { POST: "AUTHED" },
  "notifications/send":                                    { POST: "ADMIN" },
  "notifications/send-notification":                       { POST: "ADMIN" },
  "notifications/test-token":                              { POST: "ADMIN" },
  "notifications/user-tokens":                             { GET: "ADMIN" },
  "payments/[paymentId]/status":                           { GET: "AUTHED" },
  "reservations":                                          { GET: "STAFF" },
  "reservations/event/[id]":                               { GET: "STAFF" },
  "reservations/[reservationId]":                          { GET: "SELF", PATCH: "SELF", DELETE: "ADMIN" },
  "reservations/[reservationId]/available-tables":         { GET: "OWNER" },
  "reservations/[reservationId]/cancel":                   { POST: "ADMIN" },
  "reservations/[reservationId]/change-table":             { POST: "OWNER" },
  "reservations/[reservationId]/check-in":                 { GET: "STAFF", POST: "STAFF" },
  "reservations/[reservationId]/complete-table-change-payment": { POST: "OWNER" },
  "reservations/[reservationId]/fix-table-change":         { POST: "ADMIN" },
  "reservations/[reservationId]/payment/[paymentId]/status": { GET: "OWNER" },
  "reservations/[reservationId]/pending-table-change-payment": { GET: "OWNER" },
  "reservations/[reservationId]/send-confirmation":        { POST: "OWNER" },
  "sitemap":                                               { GET: "PUBLIC" },
  "stripe/webhook":                                        { POST: "STRIPE_SIGNATURE" },
  "upload/avatar":                                         { POST: "AUTHED" },
  "users":                                                 { GET: "ADMIN", POST: "ADMIN" },
  // PATCH branches internally (self -> profile fields, admin -> role), which a
  // single guard cannot express; the escalation rules are asserted separately
  // in the "privileged field protection" suite below.
  "users/[userId]":                                        { GET: "SELF", PATCH: "AUTHED" },
  "users/[userId]/reservations":                           { GET: "SELF" },
};

const API_DIR = join(process.cwd(), "app", "api");

function findRoutes(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) findRoutes(full, acc);
    else if (entry === "route.ts") acc.push(full);
  }
  return acc;
}

function classify(body: string): Level {
  if (/constructEvent/.test(body)) return "STRIPE_SIGNATURE";
  if (/loadAuthorizedReservation/.test(body)) return "OWNER";
  if (/requireSelfOrRole/.test(body)) return "SELF";
  if (/requireRole\(\s*request\s*,\s*ADMIN_ROLES/.test(body)) return "ADMIN";
  if (/requireRole\(\s*request\s*,\s*STAFF_ROLES/.test(body)) return "STAFF";
  if (/requireUser|getAuthedUser/.test(body)) return "AUTHED";
  return "PUBLIC";
}

function handlers(source: string): Array<{ method: string; level: Level }> {
  const out: Array<{ method: string; level: Level }> = [];
  const re = /export async function (GET|POST|PATCH|PUT|DELETE)\s*\(/g;
  let m: RegExpExecArray | null;
  const starts: Array<{ method: string; index: number }> = [];
  while ((m = re.exec(source))) starts.push({ method: m[1], index: m.index });
  starts.forEach((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : source.length;
    out.push({ method: s.method, level: classify(source.slice(s.index, end)) });
  });
  return out;
}

describe("API route authorization policy", () => {
  const routes = findRoutes(API_DIR);

  it("finds the expected number of route files", () => {
    assert.ok(routes.length > 30, `only found ${routes.length} routes`);
  });

  it("no handler is unintentionally public", () => {
    const violations: string[] = [];
    for (const file of routes) {
      const key = file.slice(API_DIR.length + 1).replace(/\/route\.ts$/, "");
      const expected = EXPECTED[key];
      const source = readFileSync(file, "utf8");
      for (const { method, level } of handlers(source)) {
        if (!expected) {
          violations.push(`${key} has no declared policy (found ${method} => ${level})`);
          continue;
        }
        const want = expected[method];
        if (!want) {
          violations.push(`${key} ${method} is not declared in EXPECTED (found ${level})`);
        } else if (want !== level) {
          violations.push(`${key} ${method}: expected ${want}, found ${level}`);
        }
      }
    }
    assert.deepEqual(violations, [], `\n  - ${violations.join("\n  - ")}\n`);
  });

  it("the Stripe webhook is not gated behind a user session", () => {
    const source = readFileSync(join(API_DIR, "stripe", "webhook", "route.ts"), "utf8");
    assert.match(source, /constructEvent/, "webhook must verify the Stripe signature");
    assert.doesNotMatch(source, /requireUser|requireRole|requireSelfOrRole/,
      "a session requirement would break Stripe delivery — Stripe sends no cookies");
  });

  it("no route still imports the forgeable cookie session helper", () => {
    for (const file of routes) {
      assert.doesNotMatch(readFileSync(file, "utf8"), /from ['"]@\/lib\/auth-utils['"]/,
        `${file} imports the deprecated cookie-trusting helper`);
    }
  });

  it("debug and dev routes are not present", () => {
    for (const file of routes) {
      assert.doesNotMatch(file, /\/api\/(debug|dev)\//, `${file} must not ship`);
    }
  });
});

describe("middleware", () => {
  const source = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");

  it("verifies the token instead of trusting a cookie body", () => {
    assert.match(source, /verifyIdTokenEdge/);
    assert.doesNotMatch(source, /JSON\.parse\([^)]*userInfo/,
      "the userInfo cookie must never be parsed for an authorization decision");
  });

  it("never logs credentials", () => {
    assert.doesNotMatch(source, /console\.log/);
  });

  it("does not build a redirect from an unvalidated external URL", () => {
    assert.match(source, /from\.startsWith\('\/'\)/, "redirect target must be a relative path");
  });
});

describe("privileged field protection", () => {
  const userRoute = readFileSync(join(API_DIR, "users", "[userId]", "route.ts"), "utf8");

  it("a role change requires the admin role", () => {
    assert.match(userRoute, /if \(requestedRole !== undefined\)/);
    assert.match(userRoute, /if \(!isAdmin\)[\s\S]{0,120}403/,
      "role changes must be refused for non-admins");
  });

  it("the role decision happens BEFORE any database access", () => {
    // Verified by live test: previously a non-admin escalation attempt still
    // caused a Firestore read, so the refusal surfaced as 500 rather than 403.
    const roleCheckAt = userRoute.indexOf("if (requestedRole !== undefined)");
    const firstReadAt = userRoute.indexOf("adminFirestore.collection('users').doc(userId).get()");
    assert.ok(roleCheckAt !== -1 && firstReadAt !== -1);
    assert.ok(roleCheckAt < firstReadAt,
      "an escalation attempt must be refused without touching the database");
  });

  it("custom claims are only set after the admin check", () => {
    const claimsAt = userRoute.indexOf("await adminAuth.setCustomUserClaims");
    const adminCheckAt = userRoute.indexOf("if (!isAdmin)");
    assert.ok(adminCheckAt !== -1 && claimsAt > adminCheckAt,
      "setCustomUserClaims must come after the admin check");
  });

  it("an admin cannot change their own role", () => {
    assert.match(userRoute, /if \(isSelf\)[\s\S]{0,200}cannot change their own role/);
  });

  it("refresh tokens are revoked when a role changes", () => {
    assert.match(userRoute, /revokeRefreshTokens/,
      "an old token would otherwise keep the old role until it expired");
  });

  it("the request body is never spread into the stored document", () => {
    assert.doesNotMatch(userRoute, /\.update\(\s*\{\s*\.\.\.data/,
      "mass assignment: an allowlist must be used instead");
    assert.match(userRoute, /SELF_EDITABLE/);
  });

  it("the self-editable allowlist does not contain role or payment fields", () => {
    const m = userRoute.match(/const SELF_EDITABLE = \[(.*?)\]/s);
    assert.ok(m, "SELF_EDITABLE not found");
    for (const forbidden of ["role", "totalAmount", "paymentId", "status"]) {
      assert.doesNotMatch(m[1], new RegExp(`['"]${forbidden}['"]`),
        `${forbidden} must not be self-editable`);
    }
  });
});

describe("refund route hardening", () => {
  const cancelRoute = readFileSync(
    join(API_DIR, "reservations", "[reservationId]", "cancel", "route.ts"), "utf8");

  it("is admin-only and re-checks revocation", () => {
    assert.match(cancelRoute, /requireRole\(request, ADMIN_ROLES, \{ checkRevoked: true \}\)/);
  });

  it("derives the refundable balance from Stripe, not the request body", () => {
    // The adapter reads the settled charge; the ceiling itself is computed in
    // the shared flow, which the scenario tests drive exhaustively.
    assert.match(cancelRoute, /charge\.amount_captured/);
    assert.match(cancelRoute, /charge\.amount_refunded/);
    assert.match(cancelRoute, /paymentIntents\.retrieve/);
    assert.match(cancelRoute, /executeCancellationRefund\(/);
    const flow = readFileSync("lib/payments/refund-flow.ts", "utf8");
    assert.match(flow, /decideRefund\(/);
  });

  it("enumerates ALL refunds, not just the first page", () => {
    assert.match(cancelRoute, /autoPagingToArray/,
      "a single list call caps at 100; missing a page could cause a duplicate refund");
  });

  it("sends an idempotency key so retries cannot double-refund", () => {
    assert.match(cancelRoute, /idempotencyKey/);
  });

  it("attributes the action to the verified uid, not a client-supplied name", () => {
    assert.match(cancelRoute, /actorUid: actor\.uid|cancelledByUid: actor\.uid/);
    assert.doesNotMatch(cancelRoute, /staffName/,
      "the old implementation took the actor's name from the request body");
  });

  it("does not return raw Stripe error text to the caller", () => {
    assert.doesNotMatch(cancelRoute, /details: .*stripeError\.message/);
  });
});

describe("containment kill switch", () => {
  const userRoute = readFileSync(join(API_DIR, "users", "[userId]", "route.ts"), "utf8");
  const usersRoute = readFileSync(join(API_DIR, "users", "route.ts"), "utf8");

  it("role changes are disabled unless explicitly enabled", () => {
    assert.match(userRoute, /ALLOW_ROLE_CHANGES_VIA_API === 'true'/,
      "must default to OFF — an unset variable must not enable it");
    assert.match(userRoute, /status: 503/);
  });

  it("API account creation is disabled by the same switch", () => {
    assert.match(usersRoute, /ALLOW_ROLE_CHANGES_VIA_API !== 'true'/);
  });

  it("the switch is checked BEFORE the admin check and before any read", () => {
    const switchAt = userRoute.indexOf("ROLE_CHANGES_ENABLED");
    const adminAt = userRoute.indexOf("if (!isAdmin)");
    const readAt = userRoute.indexOf("adminFirestore.collection('users').doc(userId).get()");
    assert.ok(switchAt < adminAt && switchAt < readAt);
  });
});
