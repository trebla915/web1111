/**
 * Phone agent data rules: which events a caller hears about, and when caller
 * ID may hint at a reservation. Runs the real transforms on plain rows; no
 * Firebase, Twilio or Stripe.
 *
 *   node --import ./tests/security/alias-hook.mjs --test tests/security/
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePhone, phoneLookupVariants } from "@/lib/utils/phone";
import { venueDateKey } from "@/lib/utils/dateFormatter";
import {
  CALLER_LOOKUP_LIMIT,
  hasPossibleUpcomingReservation,
  isUpcomingReservation,
  toVoiceEvents,
} from "@/lib/voice-agent/data";

const TODAY = "2026-10-01";

describe("voice events: discovery is separate from reservations", () => {
  const events = toVoiceEvents([
    { id: "later", data: { title: "DJ Sol", date: "2026-10-10T21:00:00", status: "active", reservationsEnabled: false, description: "internal notes", flyerUrl: "x" } },
    { id: "reservable", data: { title: "Neon Nights", date: "2026-10-03", reservationsEnabled: true } },
    { id: "tonight", data: { title: "Tonight", date: TODAY } },
    { id: "past", data: { title: "Last Week", date: "2026-09-24", reservationsEnabled: true } },
    { id: "inactive", data: { title: "Cancelled Show", date: "2026-10-05", status: "cancelled", reservationsEnabled: true } },
    { id: "draft", data: { title: "Draft", date: "2026-10-06", status: "draft" } },
    { id: "undated", data: { title: "No Date" } },
    { id: "unparseable", data: { title: "Bad Date", date: "October 9" } },
  ], TODAY);

  it("includes an active future event with reservations enabled", () => {
    assert.ok(events.some((event) => event.id === "reservable"));
  });

  it("includes an active future event with reservations disabled", () => {
    assert.ok(events.some((event) => event.id === "later"));
  });

  it("includes an event happening today", () => {
    assert.ok(events.some((event) => event.id === "tonight"));
  });

  it("drops past, inactive, undated and unparseable events", () => {
    for (const id of ["past", "inactive", "draft", "undated", "unparseable"]) {
      assert.ok(!events.some((event) => event.id === id), id);
    }
  });

  it("derives reservationsAvailable from reservationsEnabled === true", () => {
    const available = Object.fromEntries(events.map((event) => [event.id, event.reservationsAvailable]));
    assert.deepEqual(available, { tonight: false, reservable: true, later: false });
  });

  it("sorts by date and exposes only id, title, date and reservationsAvailable", () => {
    assert.deepEqual(events, [
      { id: "tonight", title: "Tonight", date: TODAY, reservationsAvailable: false },
      { id: "reservable", title: "Neon Nights", date: "2026-10-03", reservationsAvailable: true },
      { id: "later", title: "DJ Sol", date: "2026-10-10T21:00:00", reservationsAvailable: false },
    ]);
  });

  it("uses the venue's date, not UTC", () => {
    // 8 pm in El Paso on Oct 1 is already Oct 2 in UTC.
    assert.equal(venueDateKey(new Date("2026-10-02T02:00:00Z")), "2026-10-01");
  });
});

describe("phone normalization", () => {
  it("normalizes caller ID and typed numbers to E.164", () => {
    for (const raw of ["+19155550123", "9155550123", "19155550123", "(915) 555-0123", "915-555-0123", " +1 915 555 0123 "]) {
      assert.equal(normalizePhone(raw), "+19155550123", raw);
    }
    assert.equal(normalizePhone("+447700900123"), "+447700900123");
  });

  it("rejects missing, hidden and malformed numbers", () => {
    for (const raw of [undefined, null, "", "anonymous", "Restricted", "sip:+19155550123@trunk", "12345", "+1915555012", "555-0123"]) {
      assert.equal(normalizePhone(raw), null, String(raw));
    }
  });

  it("looks up the spellings the web contact form stores", () => {
    const variants = phoneLookupVariants("+19155550123");
    for (const stored of ["+19155550123", "9155550123", "(915) 555-0123", "915-555-0123", "915.555.0123"]) {
      assert.ok(variants.includes(stored), stored);
    }
    assert.ok(variants.length <= 30, "Firestore `in` accepts at most 30 values");
    assert.ok(variants.every((variant) => normalizePhone(variant) === "+19155550123"), "every variant is the same number");
  });
});

describe("caller ID reservation hint", () => {
  const rows: Record<string, Array<Record<string, unknown>>> = {
    "(915) 555-0123": [
      { eventName: "Neon Nights", eventDate: "2026-10-03", status: "confirmed", tableNumber: 7, totalAmount: 812.5 },
    ],
    "+19155550188": [
      { eventName: "Last Week", eventDate: "2026-09-24", status: "confirmed" },
      { eventName: "Neon Nights", eventDate: "2026-10-03", status: "cancelled" },
    ],
  };
  const calls: Array<{ values: string[]; limit: number }> = [];
  const find = async (values: string[], limit: number) => {
    calls.push({ values, limit });
    return values.flatMap((value) => rows[value] ?? []);
  };

  it("matches a SIP caller whose number was stored in another format", async () => {
    assert.equal(await hasPossibleUpcomingReservation("+19155550123", find, TODAY), true);
  });

  it("ignores past and cancelled reservations", async () => {
    assert.equal(await hasPossibleUpcomingReservation("+19155550188", find, TODAY), false);
  });

  it("is false for a number with no reservations", async () => {
    assert.equal(await hasPossibleUpcomingReservation("+19155550999", find, TODAY), false);
  });

  it("does not query for missing or hidden caller ID", async () => {
    const before = calls.length;
    for (const raw of [undefined, "", "anonymous"]) {
      assert.equal(await hasPossibleUpcomingReservation(raw, find, TODAY), false);
    }
    assert.equal(calls.length, before);
  });

  it("bounds every query", () => {
    assert.ok(calls.length > 0);
    assert.ok(calls.every((call) => call.limit === CALLER_LOOKUP_LIMIT && call.limit <= 50));
  });

  it("treats only pending and confirmed reservations for today or later as upcoming", () => {
    assert.equal(isUpcomingReservation({ status: "pending", eventDate: TODAY }, TODAY), true);
    assert.equal(isUpcomingReservation({ eventDate: "2026-10-03" }, TODAY), true, "status defaults to pending");
    for (const status of ["cancelled", "completed", "checked-in", "refunded"]) {
      assert.equal(isUpcomingReservation({ status, eventDate: "2026-10-03" }, TODAY), false, status);
    }
    assert.equal(isUpcomingReservation({ status: "confirmed" }, TODAY), false, "no event date");
  });
});
