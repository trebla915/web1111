/**
 * Credential rejection.
 *
 * The middleware previously accepted any non-empty `authToken` cookie and
 * base64-decoded the payload. These assert that forged and malformed
 * credentials are refused by the verifier that replaced it.
 *
 * Only offline cases are covered here: a token whose signature must be checked
 * against Google's live keys needs network access, so signature-validity is
 * exercised in the staging checklist rather than in unit tests.
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

let verifyIdTokenEdge: (t: string | undefined) => Promise<unknown>;

before(async () => {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||= "test-project";
  ({ verifyIdTokenEdge } = await import("../../lib/auth/edge.ts"));
});

/** Builds a syntactically valid but unsigned JWT. */
function forgeToken(payload: Record<string, unknown>, alg = "none"): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg, typ: "JWT" })}.${b64(payload)}.`;
}

describe("token verification rejects forged credentials", () => {
  it("rejects a missing token", async () => {
    assert.equal(await verifyIdTokenEdge(undefined), null);
    assert.equal(await verifyIdTokenEdge(""), null);
  });

  it("rejects a non-JWT string", async () => {
    assert.equal(await verifyIdTokenEdge("definitely-not-a-jwt"), null);
    assert.equal(await verifyIdTokenEdge("a.b.c"), null);
  });

  it("rejects an unsigned token that claims the admin role", async () => {
    // This is precisely the attack the old middleware permitted: assert a role
    // in an unverified payload.
    const forged = forgeToken({
      sub: "attacker",
      role: "admin",
      aud: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      iss: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    assert.equal(await verifyIdTokenEdge(forged), null);
  });

  it("rejects an expired token even if otherwise well formed", async () => {
    const expired = forgeToken({
      sub: "user-1",
      aud: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      iss: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      exp: Math.floor(Date.now() / 1000) - 3600,
    });
    assert.equal(await verifyIdTokenEdge(expired), null);
  });

  it("rejects a token signed with a symmetric algorithm", async () => {
    // RS256 only: an attacker who knows a shared string must not be able to
    // mint tokens.
    const hs = forgeToken({ sub: "attacker", role: "admin" }, "HS256");
    assert.equal(await verifyIdTokenEdge(hs), null);
  });

  it("returns null rather than throwing, so middleware cannot fail open or 500", async () => {
    for (const bad of [undefined, "", "x", "..", "a.b", forgeToken({})]) {
      const result = await verifyIdTokenEdge(bad as string | undefined);
      assert.equal(result, null);
    }
  });
});
