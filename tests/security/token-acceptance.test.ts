/**
 * Accepted-credential tests.
 *
 * These sign real RS256 tokens with a locally generated key and verify them
 * through the *same* code path production uses — only the key source is
 * swapped. So the signature check, issuer, audience, expiry and algorithm
 * pinning are all genuinely exercised, not mocked.
 *
 *   node --test tests/security/
 */
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";

import { createIdTokenVerifier, normalizeEdgeRole } from "../../lib/auth/edge.ts";

const PROJECT = "eptx-prod";
const OTHER_PROJECT = "someone-elses-project";

let verify: (t?: string) => Promise<{ uid: string; role: string } | null>;
let sign: (payload: Record<string, unknown>, opts?: { alg?: string; kid?: string }) => Promise<string>;
let otherKeySign: (payload: Record<string, unknown>) => Promise<string>;

before(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  jwk.kid = "test-key-1";
  jwk.alg = "RS256";

  // Only OUR key is trusted, exactly as production trusts only Google's.
  const jwks = createLocalJWKSet({ keys: [jwk] });
  verify = createIdTokenVerifier({ jwks, projectId: PROJECT });

  sign = (payload, opts = {}) =>
    new SignJWT(payload)
      .setProtectedHeader({ alg: opts.alg ?? "RS256", kid: opts.kid ?? "test-key-1" })
      .sign(privateKey);

  // A second keypair that the verifier does NOT trust.
  const attacker = await generateKeyPair("RS256");
  otherKeySign = (payload) =>
    new SignJWT(payload)
      .setProtectedHeader({ alg: "RS256", kid: "test-key-1" }) // claims our kid
      .sign(attacker.privateKey);
});

const now = () => Math.floor(Date.now() / 1000);
const validClaims = (over: Record<string, unknown> = {}) => ({
  iss: `https://securetoken.google.com/${PROJECT}`,
  aud: PROJECT,
  sub: "uid-123",
  auth_time: now() - 60,
  iat: now() - 60,
  exp: now() + 3600,
  ...over,
});

describe("ACCEPTED: legitimate credentials", () => {
  it("accepts an ordinary authenticated customer", async () => {
    const identity = await verify(await sign(validClaims()));
    assert.deepEqual(identity, { uid: "uid-123", role: "user" });
  });

  it("accepts an admin whose token carries the admin custom claim", async () => {
    const identity = await verify(await sign(validClaims({ sub: "admin-1", role: "admin" })));
    assert.deepEqual(identity, { uid: "admin-1", role: "admin" },
      "a real admin must be able to reach /admin — this is the deploy-blocking case");
  });

  it("accepts staff and promoter claims", async () => {
    assert.equal((await verify(await sign(validClaims({ role: "staff" }))))?.role, "staff");
    assert.equal((await verify(await sign(validClaims({ role: "promoter" }))))?.role, "promoter");
  });

  it("treats a token with no role claim as an ordinary user, not an error", async () => {
    const identity = await verify(await sign(validClaims()));
    assert.equal(identity?.role, "user");
  });

  it("accepts a token that is close to, but not past, expiry", async () => {
    assert.ok(await verify(await sign(validClaims({ exp: now() + 5 }))));
  });

  it("accepts within the configured clock-drift tolerance", async () => {
    // 30s past expiry, inside the 60s tolerance: a real edge/Google clock skew
    // must not sign users out.
    assert.ok(await verify(await sign(validClaims({ exp: now() - 30 }))));
  });
});

describe("REJECTED: issuer, audience, expiry, algorithm, signer", () => {
  it("rejects a token signed by a key we do not trust", async () => {
    assert.equal(await verify(await otherKeySign(validClaims({ role: "admin" }))), null);
  });

  it("rejects a wrong issuer", async () => {
    const t = await sign(validClaims({ iss: `https://securetoken.google.com/${OTHER_PROJECT}` }));
    assert.equal(await verify(t), null);
  });

  it("rejects a wrong audience — a token from another Firebase project", async () => {
    const t = await sign(validClaims({ aud: OTHER_PROJECT }));
    assert.equal(await verify(t), null);
  });

  it("rejects an expired token beyond tolerance", async () => {
    assert.equal(await verify(await sign(validClaims({ exp: now() - 120 }))), null);
  });

  it("rejects an unsigned (alg:none) token asserting admin", async () => {
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const forged = `${b64({ alg: "none", typ: "JWT" })}.${b64(validClaims({ role: "admin" }))}.`;
    assert.equal(await verify(forged), null);
  });

  it("rejects a token with no subject", async () => {
    const t = await sign({ ...validClaims(), sub: undefined });
    assert.equal(await verify(t), null);
  });

  it("rejects malformed input without throwing", async () => {
    for (const bad of [undefined, "", "x", "a.b", "a.b.c"]) {
      assert.equal(await verify(bad as string | undefined), null);
    }
  });
});

describe("role claim cannot be smuggled", () => {
  it("only the four known roles survive normalisation", () => {
    for (const bad of ["ADMIN", "administrator", "admin ", 1, true, null, undefined, { role: "admin" }, ["admin"]]) {
      assert.equal(normalizeEdgeRole(bad), "user", `${JSON.stringify(bad)} must not become a role`);
    }
    for (const good of ["admin", "staff", "promoter"]) {
      assert.equal(normalizeEdgeRole(good), good);
    }
  });

  it("a signed token claiming a bogus role degrades to user, not admin", async () => {
    const identity = await verify(await sign(validClaims({ role: "superadmin" })));
    assert.equal(identity?.role, "user");
  });
});
