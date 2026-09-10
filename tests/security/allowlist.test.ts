/**
 * Transitional privilege model.
 *
 * Neither existing role source is trustworthy:
 *   - Firestore `role` was writable by an unauthenticated API AND written from
 *     the browser for any email containing "admin".
 *   - Custom claims were settable by that same unauthenticated API.
 *
 * So during the transition privilege comes only from a reviewed allowlist,
 * and the system fails CLOSED when nobody has been reviewed yet.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const server = readFileSync("lib/auth/server.ts", "utf8");
const policy = readFileSync("lib/auth/policy.ts", "utf8");
const authProvider = readFileSync("components/providers/AuthProvider.tsx", "utf8");

describe("privilege comes only from a reviewed allowlist", () => {
  it("a role claim alone does not grant privilege", () => {
    assert.match(server, /export function effectiveRole/);
    assert.match(policy, /export function decideEffectiveRole/);
    assert.match(policy, /const approved = allowlist\.get\(uid\)/);
    assert.match(policy, /if \(!approved\) return \{ role: "user", reason: "not-allowlisted" \}/,
      "an unapproved uid must act as an ordinary user regardless of its claim");
    assert.match(policy, /if \(claimedRole !== approved\) return \{ role: "user", reason: "claim-missing" \}/,
      "an allowlisted uid without the intended claim must not be privileged");
    assert.match(policy, /if \(!isVerifiedSignIn\(context\)\)/,
      "an unverified or anonymous sign-in must never be privileged");
  });

  it("the resolved role is applied at the single verification point", () => {
    assert.match(server, /role: effectiveRole\(identity\.uid, identity\.role, \{/,
      "every guard must see the allowlist-resolved role, not the raw claim");
    assert.match(server, /emailVerified: decoded\.email_verified === true/,
      "the verification decision must come from the verified token");
    assert.match(server, /signInProvider: decoded\.firebase\?\.sign_in_provider/);
  });

  it("an ignored privileged claim is logged for review", () => {
    assert.match(server, /privileged claim ignored — uid not on the reviewed allowlist/);
  });

  it("FAILS CLOSED when the allowlist is unset", () => {
    assert.match(server, /export function privilegedOperationsAvailable/);
    assert.match(server, /TRUST_CUSTOM_CLAIMS \|\| ALLOWLIST\.size > 0/);
    assert.match(server, /Privileged operations are unavailable until administrators have been verified/);
  });

  it("retiring the allowlist is explicit and opt-in", () => {
    assert.match(server, /TRUST_CUSTOM_CLAIMS === "true"/,
      "an unset variable must not silently re-trust claims");
  });

  it("the discredited Firestore-role fallback is gone", () => {
    assert.doesNotMatch(server, /ALLOW_FIRESTORE_ROLE_FALLBACK/);
    assert.doesNotMatch(server, /roleFallback/);
    const reservation = readFileSync("lib/auth/reservation.ts", "utf8");
    assert.doesNotMatch(reservation, /roleFallback/);
  });
});

describe("the browser can no longer assign itself a role", () => {
  it("email-based admin inference is removed", () => {
    // `email.includes('admin')` matched notadmin@, sysadmin@, badminton@ …
    const codeOnly = authProvider
      .split("\n")
      .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
      .join("\n");
    assert.doesNotMatch(codeOnly, /includes\('admin'\)/);
    assert.doesNotMatch(codeOnly, /includes\('promoter'\)/);
  });

  it("no client-side write to the role field remains", () => {
    assert.doesNotMatch(authProvider, /setUserRole\(/);
  });

  it("the UI role is read from verified token claims", () => {
    assert.match(authProvider, /getIdTokenResult\(\)/);
  });

  it("registration always creates an ordinary customer", () => {
    // The type name is UserRole after the design merge; what matters is that
      // registration hard-codes 'user' and never infers a role from the email.
      assert.match(authProvider, /const role: UserRole = 'user';/);
      assert.doesNotMatch(authProvider, /^\s*const isAdmin = .*includes\('admin'\)/m,
        "no browser-side role inference may return");
  });
});
