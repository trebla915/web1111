/**
 * 21+ confirmation for the bottle-selection step.
 *
 * These tests assert what the gate DOES do. They deliberately also record what
 * it does NOT do, so nobody later mistakes it for age verification or for an
 * access control on the images.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it, beforeEach } from "node:test";

// Minimal localStorage stand-in; the module must tolerate it throwing.
let store: Record<string, string> = {};
let throwOnAccess = false;
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => { if (throwOnAccess) throw new Error("blocked"); return store[k] ?? null; },
    setItem: (k: string, v: string) => { if (throwOnAccess) throw new Error("blocked"); store[k] = v; },
    removeItem: (k: string) => { if (throwOnAccess) throw new Error("blocked"); delete store[k]; },
  },
};

const { hasConfirmedAge, recordAgeConfirmation, clearAgeConfirmation, ageConfirmationKey } =
  await import("@/lib/compliance/age-confirmation");

beforeEach(() => { store = {}; throwOnAccess = false; });

describe("the confirmation gate", () => {
  it("starts unconfirmed", () => {
    assert.equal(hasConfirmedAge("user-1"), false);
  });

  it("remembers a confirmation for that account", () => {
    recordAgeConfirmation("user-1");
    assert.equal(hasConfirmedAge("user-1"), true);
  });

  it("is per-account — one person's attestation is not inherited by another", () => {
    recordAgeConfirmation("user-1");
    assert.equal(hasConfirmedAge("user-2"), false,
      "a second account sharing the browser must confirm for itself");
  });

  it("requires a signed-in account — no uid, no confirmation", () => {
    assert.equal(hasConfirmedAge(null), false);
    assert.equal(hasConfirmedAge(undefined), false);
    assert.equal(hasConfirmedAge(""), false);
    recordAgeConfirmation(null);
    assert.deepEqual(store, {}, "nothing may be recorded without an account");
  });

  it("can be cleared", () => {
    recordAgeConfirmation("user-1");
    clearAgeConfirmation("user-1");
    assert.equal(hasConfirmedAge("user-1"), false);
  });

  it("namespaces its key so it cannot collide with other stored values", () => {
    assert.equal(ageConfirmationKey("abc"), "age21:abc");
  });
});

describe("fails closed when storage is unavailable", () => {
  it("reports unconfirmed rather than throwing (private window, blocked storage)", () => {
    recordAgeConfirmation("user-1");
    throwOnAccess = true;
    assert.equal(hasConfirmedAge("user-1"), false,
      "the customer is asked again — the harmless direction");
  });

  it("recording never throws", () => {
    throwOnAccess = true;
    assert.doesNotThrow(() => recordAgeConfirmation("user-1"));
    assert.doesNotThrow(() => clearAgeConfirmation("user-1"));
  });
});

describe("the gate is enforced in the reservation flow", () => {
  const page = readFileSync("app/reserve/[id]/details/page.tsx", "utf8");
  const gate = readFileSync("components/reserve/AgeConfirmationGate.tsx", "utf8");

  it("wraps the bottle-selection panel", () => {
    assert.match(page, /<AgeConfirmationGate/);
    assert.match(page, /<\/AgeConfirmationGate>/);
  });

  it("does not fetch bottles until signed in AND confirmed", () => {
    assert.match(page, /if \(eventId && user && hasConfirmedAge\(user\.uid\)\)/,
      "fetching first and hiding the result would make the gate cosmetic");
  });

  it("requires sign-in independently of the confirmation", () => {
    assert.match(gate, /if \(!user\)/);
    assert.match(page, /if \(!user\) \{[\s\S]*?router\.push\('\/auth\/login'\)/,
      "the flow already redirects unauthenticated visitors");
  });

  it("offers a decline path that closes the panel", () => {
    assert.match(page, /onDecline=\{\(\) => setShowBottleSelection\(false\)\}/);
  });
});

describe("documented limits — deliberately asserted so they are not quietly lost", () => {
  const mod = readFileSync("lib/compliance/age-confirmation.ts", "utf8");
  const rules = readFileSync(
    "../web1111/audit-report/firestore-rules/storage.rules", "utf8");

  it("the module states it is an attestation, not verification", () => {
    assert.match(mod, /NOT age verification/);
  });

  it("the module states direct image URLs are not age restricted", () => {
    assert.match(mod, /Direct bottle image URLs are NOT age restricted/);
  });

  it("the Storage rules make the same statement, so neither can drift", () => {
    assert.match(rules, /a direct bottle image URL is NOT age restricted/i);
    assert.match(rules, /CANNOT enforce it, and do not claim to/);
  });
});
