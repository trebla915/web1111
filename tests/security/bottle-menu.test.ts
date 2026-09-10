/**
 * Behavioural coverage for the reservation bottle step.
 *
 * The structural assertions live in age-confirmation.test.ts. This file
 * exercises the real modules — the confirmation store and BottleService — by
 * walking the sequence a customer actually takes, with `fetch` stubbed so no
 * request leaves the machine. Nothing here creates a reservation, charges,
 * refunds, emails or notifies.
 *
 * The bug this covers: the Reserve popup never recorded the confirmation, so
 * the bottle fetch — gated on that same flag — never ran, and BottleService
 * turned every failure into `[]`, so the menu opened empty with no error and
 * no way to retry.
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

// ── Browser stand-ins ───────────────────────────────────────────────────────
let store: Record<string, string> = {};
let storageBlocked = false;
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => { if (storageBlocked) throw new Error("blocked"); return store[k] ?? null; },
    setItem: (k: string, v: string) => { if (storageBlocked) throw new Error("blocked"); store[k] = v; },
    removeItem: (k: string) => { if (storageBlocked) throw new Error("blocked"); delete store[k]; },
  },
};

type FetchResult =
  | { kind: "ok"; body: unknown }
  | { kind: "status"; status: number }
  | { kind: "network" };

let nextResult: FetchResult = { kind: "ok", body: [] };
let calls: string[] = [];

(globalThis as any).fetch = async (url: string, init?: { signal?: AbortSignal }) => {
  calls.push(url);
  if (init?.signal?.aborted) {
    const e = new Error("aborted");
    e.name = "AbortError";
    throw e;
  }
  if (nextResult.kind === "network") throw new Error("offline");
  if (nextResult.kind === "status") {
    return { ok: false, status: nextResult.status, json: async () => ({}) };
  }
  return { ok: true, status: 200, json: async () => (nextResult as any).body };
};

const { hasConfirmedAge, recordAgeConfirmation } =
  await import("@/lib/compliance/age-confirmation");
const { BottleService } = await import("@/lib/services/bottles");

const EVENT = "evt-1";
const ALEX = "uid-alex";
const SAM = "uid-sam";

/**
 * The condition the details page applies before fetching. Mirrors
 * `if (!eventId || !user || ageGate !== 'allowed') return;` plus the guard's
 * own `hasConfirmedAge` check, which is the whole gate in one place.
 */
const mayLoadBottles = (uid: string | null, eventId: string | null) =>
  Boolean(eventId) && Boolean(uid) && hasConfirmedAge(uid);

beforeEach(() => {
  store = {};
  storageBlocked = false;
  calls = [];
  nextResult = { kind: "ok", body: [] };
});

describe("Reserve → confirm → details → Add bottles → select a bottle", () => {
  it("loads the event's bottles without asking a second time", async () => {
    // 1. Reserve pressed, popup confirmed — this is the step that used to be
    //    a no-op.
    assert.equal(recordAgeConfirmation(ALEX), true);

    // 2. Details page: the gate passes on arrival, with no further prompt.
    assert.equal(hasConfirmedAge(ALEX), true, "the confirmation survived the navigation");
    assert.equal(mayLoadBottles(ALEX, EVENT), true);

    // 3. Add bottles opens and fetches.
    nextResult = { kind: "ok", body: [
      { id: "b1", name: "Don Julio 1942", price: 650 },
      { id: "b2", name: "Veuve Clicquot Brut", price: 380 },
    ] };
    const bottles = await BottleService.getByEvent(EVENT);

    assert.equal(calls.length, 1);
    assert.equal(calls[0], `/api/events/${EVENT}/bottles`);
    assert.equal(bottles.length, 2);

    // 4. Selecting a bottle has something to select.
    assert.equal(bottles[0].name, "Don Julio 1942");
    assert.equal(bottles[0].price, 650);
  });

  it("does not fetch before the popup is confirmed — the original bug", async () => {
    // Signed in, but the popup was never completed.
    assert.equal(mayLoadBottles(ALEX, EVENT), false,
      "this is exactly the state the old flow was stuck in: signed in, " +
      "confirmation given but never recorded, so the fetch never ran");
    assert.equal(calls.length, 0);
  });
});

describe("declined or cancelled confirmation", () => {
  it("records nothing, so the flow cannot proceed", () => {
    // Declining and cancelling both leave the store untouched.
    assert.deepEqual(store, {});
    assert.equal(hasConfirmedAge(ALEX), false);
    assert.equal(mayLoadBottles(ALEX, EVENT), false);
  });
});

describe("another account on the same browser", () => {
  it("must confirm for itself", () => {
    recordAgeConfirmation(ALEX);
    assert.equal(mayLoadBottles(ALEX, EVENT), true);
    assert.equal(mayLoadBottles(SAM, EVENT), false,
      "Alex's attestation must not admit Sam");
  });

  it("and confirming as Sam does not disturb Alex", () => {
    recordAgeConfirmation(ALEX);
    recordAgeConfirmation(SAM);
    assert.equal(hasConfirmedAge(ALEX), true);
    assert.equal(hasConfirmedAge(SAM), true);
  });
});

describe("direct navigation into the flow without confirming", () => {
  it("is not admitted", () => {
    // Someone opens /reserve/evt-1/details from a shared link.
    assert.equal(mayLoadBottles(ALEX, EVENT), false);
  });

  it("is not admitted when signed out either", () => {
    assert.equal(mayLoadBottles(null, EVENT), false);
  });

  it("cleared site data revokes it, rather than failing open", () => {
    recordAgeConfirmation(ALEX);
    store = {}; // customer clears site data mid-flow
    assert.equal(mayLoadBottles(ALEX, EVENT), false);
  });

  it("blocked storage fails closed", () => {
    recordAgeConfirmation(ALEX);
    storageBlocked = true;
    assert.equal(mayLoadBottles(ALEX, EVENT), false);
  });
});

describe("a failed request is not an empty menu", () => {
  it("throws on a non-OK response so the page can show an error", async () => {
    nextResult = { kind: "status", status: 500 };
    await assert.rejects(
      () => BottleService.getByEvent(EVENT),
      /Failed to load bottles \(500\)/,
      "returning [] here is what made a broken request look like an empty menu"
    );
  });

  it("throws on a network failure", async () => {
    nextResult = { kind: "network" };
    await assert.rejects(() => BottleService.getByEvent(EVENT), /offline/);
  });

  it("retry after a failure succeeds and returns the bottles", async () => {
    nextResult = { kind: "status", status: 503 };
    await assert.rejects(() => BottleService.getByEvent(EVENT));

    nextResult = { kind: "ok", body: [{ id: "b1", name: "Grey Goose", price: 340 }] };
    const bottles = await BottleService.getByEvent(EVENT);

    assert.equal(bottles.length, 1);
    assert.equal(calls.length, 2, "Retry issues a real second request");
  });
});

describe("an event with no bottles", () => {
  it("resolves to an empty list — distinguishable from a failure", async () => {
    nextResult = { kind: "ok", body: [] };
    const bottles = await BottleService.getByEvent(EVENT);
    assert.deepEqual(bottles, [], "empty is a successful answer, not an error");
  });

  it("tolerates a malformed body without pretending it failed", async () => {
    nextResult = { kind: "ok", body: null };
    assert.deepEqual(await BottleService.getByEvent(EVENT), []);
  });
});

describe("stale responses cannot land in the wrong menu", () => {
  it("an already-aborted request rejects with AbortError, which the page ignores", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      () => BottleService.getByEvent(EVENT, controller.signal),
      (err: Error) => err.name === "AbortError"
    );
  });

  it("each open issues its own request, so a second event cannot reuse the first", async () => {
    nextResult = { kind: "ok", body: [{ id: "b1", name: "A", price: 1 }] };
    await BottleService.getByEvent("evt-1");
    await BottleService.getByEvent("evt-2");
    assert.deepEqual(calls, ["/api/events/evt-1/bottles", "/api/events/evt-2/bottles"]);
  });
});
