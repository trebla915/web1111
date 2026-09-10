/**
 * 21+ confirmation for the reservation flow.
 *
 * These tests assert what the gate DOES do. They deliberately also record what
 * it does NOT do, so nobody later mistakes it for age verification or for an
 * access control on the images.
 *
 * The flow has ONE prompt: the Age Verification popup on the event page, shown
 * when the customer presses Reserve. There used to be a second, differently
 * worded prompt inline in the bottle step. The single-popup shape is asserted
 * below so it cannot quietly grow a second gate again.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it, beforeEach } from "node:test";

// Minimal localStorage stand-in; the module must tolerate it throwing.
let store: Record<string, string> = {};
let throwOnAccess = false;
/** Simulates a browser that accepts a write and silently discards it. */
let swallowWrites = false;
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => { if (throwOnAccess) throw new Error("blocked"); return store[k] ?? null; },
    setItem: (k: string, v: string) => {
      if (throwOnAccess) throw new Error("blocked");
      if (swallowWrites) return;
      store[k] = v;
    },
    removeItem: (k: string) => { if (throwOnAccess) throw new Error("blocked"); delete store[k]; },
  },
};

const { hasConfirmedAge, recordAgeConfirmation, clearAgeConfirmation, ageConfirmationKey } =
  await import("@/lib/compliance/age-confirmation");

beforeEach(() => { store = {}; throwOnAccess = false; swallowWrites = false; });

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

  it("survives navigation — a later read in the same browser still sees it", () => {
    recordAgeConfirmation("user-1");
    // A new page in the flow reads the same store; nothing in the module holds
    // the value in memory, so this is the real cross-navigation behaviour.
    assert.equal(hasConfirmedAge("user-1"), true);
  });
});

describe("recording reports whether it actually persisted", () => {
  it("returns true when the write survives", () => {
    assert.equal(recordAgeConfirmation("user-1"), true);
  });

  it("returns false without an account", () => {
    assert.equal(recordAgeConfirmation(null), false);
  });

  it("returns false when storage throws", () => {
    throwOnAccess = true;
    assert.equal(recordAgeConfirmation("user-1"), false,
      "the caller must be able to tell the customer, not proceed silently");
  });

  it("returns false when the browser accepts the write then discards it", () => {
    swallowWrites = true;
    assert.equal(recordAgeConfirmation("user-1"), false,
      "a bare setItem cannot detect this; the read-back can");
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

describe("one prompt: the Reserve popup on the event page", () => {
  const details = readFileSync("components/events/EventDetails.tsx", "utf8");

  it("shows the Age Verification popup when Reserve is pressed", () => {
    assert.match(details, /<AgeVerificationModal/);
    assert.match(details, /setShowAgeVerification\(true\)/);
  });

  it("requires a signed-in account before asking", () => {
    assert.match(details, /if \(!user\?\.uid\)[\s\S]{0,200}?router\.push\(`\/auth\/login/,
      "the confirmation is stored per account, so there must be an account");
  });

  it("RECORDS the confirmation before navigating — the original bug", () => {
    const verified = details.slice(details.indexOf("const handleAgeVerified"));
    const body = verified.slice(0, verified.indexOf("const handleAgeDenied"));
    assert.match(body, /recordAgeConfirmation\(user\.uid\)/,
      "navigating without recording discarded the answer and left the bottle step gated");
    assert.ok(
      body.indexOf("recordAgeConfirmation") < body.indexOf("router.push"),
      "it must be recorded BEFORE the navigation that depends on it"
    );
  });

  it("does not navigate when the confirmation could not be saved", () => {
    const verified = details.slice(details.indexOf("const handleAgeVerified"));
    const body = verified.slice(0, verified.indexOf("const handleAgeDenied"));
    assert.match(body, /if \(!recordAgeConfirmation\(user\.uid\)\)[\s\S]{0,400}?return;/,
      "an unsaved confirmation must be surfaced, not silently proceeded on");
    assert.match(body, /blocking site data/i, "and it must say so in words the customer can act on");
  });

  it("declining does not continue into the reservation", () => {
    const denied = details.slice(details.indexOf("const handleAgeDenied"));
    const body = denied.slice(0, denied.indexOf("};") + 2);
    assert.doesNotMatch(body, /\/reserve\//, "declining must never reach the reservation flow");
    assert.match(body, /router\.push\('\/'\)/);
  });

  it("cancelling only closes the popup", () => {
    assert.match(details, /onClose=\{\(\) => setShowAgeVerification\(false\)\}/);
  });

  it("the second, inline prompt is gone", () => {
    const page = readFileSync("app/reserve/[id]/details/page.tsx", "utf8");
    assert.doesNotMatch(page, /AgeConfirmationGate/,
      "two prompts with two wordings was the confusing half of this bug");
    assert.ok(!existsSync("components/reserve/AgeConfirmationGate.tsx"),
      "the component is removed, not just unused — a dead security-looking gate misleads");
  });
});

describe("the flow returns unconfirmed arrivals to that same popup", () => {
  const guard = readFileSync("lib/compliance/useAgeConfirmationGuard.ts", "utf8");
  const select = readFileSync("app/reserve/[id]/page.tsx", "utf8");
  const details = readFileSync("app/reserve/[id]/details/page.tsx", "utf8");

  it("sends an unconfirmed customer back to the event page, not around the gate", () => {
    assert.match(guard, /hasConfirmedAge\(uid\)/);
    assert.match(guard, /router\.replace\(`\/events\/\$\{eventId\}`\)/,
      "back to the page that owns the Reserve popup");
    assert.match(guard, /setState\('redirecting'\)|setState\("redirecting"\)/);
  });

  it("does not bounce while auth is still resolving", () => {
    assert.match(guard, /if \(!enabled \|\| !eventId\) return;/);
    assert.match(guard, /if \(!uid\)[\s\S]{0,120}?return;/,
      "no account is the sign-in redirect's job, not this guard's");
  });

  it("guards both the table-selection step and the details step", () => {
    assert.match(select, /useAgeConfirmationGuard\(eventId, user\?\.uid, !authLoading\)/);
    assert.match(details, /useAgeConfirmationGuard\(eventId, user\?\.uid, !authLoading\)/);
  });
});

describe("the bottle menu", () => {
  const page = readFileSync("app/reserve/[id]/details/page.tsx", "utf8");
  const service = readFileSync("lib/services/bottles.ts", "utf8");

  it("fetches only when signed in, confirmed, and the menu is open", () => {
    assert.match(page, /if \(!showBottleSelection\) return;/);
    assert.match(page, /if \(!eventId \|\| !user \|\| ageGate !== 'allowed'\) return;/,
      "fetching first and hiding the result would make the gate cosmetic");
  });

  it("re-runs when the gate opens, so confirming does not leave an empty menu", () => {
    assert.match(page, /\}, \[eventId, user, showBottleSelection, ageGate, bottlesReloadKey\]\);/,
      "ageGate in the dependency list is what the old inline-child gate could not do");
  });

  it("uses its own loading state, not the whole page's", () => {
    assert.match(page, /const \[bottlesLoading, setBottlesLoading\]/);
    assert.match(page, /data-testid="bottle-menu-loading"/);
    assert.doesNotMatch(
      page.slice(page.indexOf("const fetchBottles")),
      /setLoading\(true\)/,
      "opening the menu must not blank the reservation page"
    );
  });

  it("shows an error with a working Retry rather than an empty menu", () => {
    assert.match(page, /data-testid="bottle-menu-error"/);
    assert.match(page, /setBottlesReloadKey\(\(n\) => n \+ 1\)/, "Retry must actually refetch");
  });

  it("distinguishes an event with no bottles from a failed request", () => {
    assert.match(page, /data-testid="bottle-menu-empty"/);
    assert.match(page, /availableBottles\.length === 0/);
  });

  it("ignores stale and aborted responses", () => {
    assert.match(page, /new AbortController\(\)/);
    assert.match(page, /controller\.abort\(\)/);
    assert.match(page, /if \(!active\) return;/);
    assert.match(page, /AbortError/);
  });

  it("the service surfaces failures instead of returning an empty list", () => {
    assert.match(service, /throw new Error\(`Failed to load bottles/,
      "returning [] made a broken request look like an empty menu");
    assert.doesNotMatch(service.slice(service.indexOf("getByEvent"), service.indexOf("addToEvent")),
      /return \[\];\s*\}\s*catch/, "no catch-and-swallow back into []");
  });

  it("preserves selection, removal and the minimum requirement", () => {
    assert.match(page, /addBottle\(bottle\)/);
    assert.match(page, /removeBottle\(bottleId\)/);
    assert.match(page, /bottleRequirements\.isMet/);
    assert.match(page, /disabled=\{!bottleRequirements\.isMet\}/,
      "Continue stays blocked until the minimum is met");
  });

  it("leaves the pricing formulas untouched", () => {
    assert.match(page, /taxableSubtotal \* 0\.0825/);
    assert.match(page, /bottlesCost \* 0\.18/);
    assert.match(page, /\(subtotal \* 0\.029\) \+ 0\.30/);
  });
});

describe("documented limits — deliberately asserted so they are not quietly lost", () => {
  const mod = readFileSync("lib/compliance/age-confirmation.ts", "utf8");

  it("the module states it is an attestation, not verification", () => {
    assert.match(mod, /NOT age verification/);
  });

  it("the module states direct image URLs are not age restricted", () => {
    assert.match(mod, /Direct bottle image URLs are NOT age restricted/);
  });

  it("the Storage rules make the same statement, so neither can drift", (t) => {
    // audit-report/ is intentionally not in git (it carries real account and UID
    // mappings and this repo is public), so this assertion runs only where that
    // working material is present.
    const rules = "audit-report/firestore-rules/storage.rules";
    if (!existsSync(rules)) {
      t.skip("audit-report/ not present — kept local, see .gitignore");
      return;
    }
    const text = readFileSync(rules, "utf8");
    assert.match(text, /a direct bottle image URL is NOT age restricted/i);
    assert.match(text, /CANNOT enforce it, and do not claim to/);
  });
});
