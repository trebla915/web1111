/**
 * Phone reservation agent — parity with the web booking flow.
 *
 * A booking taken over the phone must collect everything the website does
 * (name, email, phone, 21+ confirmation, guests within capacity, bottles that
 * meet the minimum), and the caller must actually receive a confirmation.
 * The route talks to Firestore, Stripe and Twilio, so these assertions are
 * structural, in the style of age-confirmation.test.ts: they pin the guards in
 * place so a refactor cannot silently drop one.
 *
 *   node --import ./tests/security/alias-hook.mjs --test tests/security/
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const route = read("app/api/voice-agent/route.ts");
const webhook = read("app/api/stripe/webhook/route.ts");
const agent = read("voice-agent/src/agent.ts");

/** The body of `if (action === '<name>') { … }` up to the next action. */
function actionBlock(name: string): string {
  const start = route.indexOf(`if (action === '${name}')`);
  assert.ok(start >= 0, `action ${name} not found`);
  const next = route.indexOf("if (action === '", start + 20);
  return route.slice(start, next < 0 ? undefined : next);
}

describe("phone reservation agent: access", () => {
  it("requires the shared secret for every action except checkout-status", () => {
    assert.match(route, /if \(!authorized\(request\) && action !== 'checkout-status'\)/);
    assert.match(route, /timingSafeEqual/, "secret must be compared in constant time");
  });

  it("checkout-status only answers for sessions it created", () => {
    assert.match(actionBlock("checkout-status"), /session\.metadata\?\.source !== PHONE_SOURCE/);
  });

  it("tags the Checkout Session itself with the phone source", () => {
    // checkout-status reads session.metadata, not the PaymentIntent's. Without
    // this every phone booking's confirmation page returned 404.
    assert.match(actionBlock("create-checkout"), /metadata: \{[^}]*source: PHONE_SOURCE[^}]*\}/);
  });
});

describe("phone reservation agent: asks for what the website asks for", () => {
  const checkout = actionBlock("create-checkout");

  it("requires a full name", () => {
    assert.match(checkout, /callerName\.length < 2/);
  });

  it("requires a valid email (the confirmation and QR code go there)", () => {
    assert.match(checkout, /!EMAIL_RE\.test\(callerEmail\)/);
    assert.match(checkout, /email: callerEmail/);
  });

  it("requires a mobile number in E.164", () => {
    assert.match(checkout, /const phone = e164\(body\.phone\)/);
  });

  it("requires the 21+ confirmation before booking", () => {
    assert.match(checkout, /body\.ageConfirmed !== true/);
  });

  it("requires the 21+ confirmation before reading the bottle menu", () => {
    assert.match(route, /action === 'bottles' && body\.ageConfirmed !== true/);
  });

  it("checks capacity and the bottle minimum against live data", () => {
    assert.match(route, /guestCount > Number\(table\.capacity/);
    assert.match(route, /selected\.length < minimumBottles/);
  });

  it("the agent's booking tool cannot be called without name, email, phone and 21+", () => {
    const tool = agent.slice(agent.indexOf("name: 'text_reservation_payment_link'"));
    const params = tool.slice(0, tool.indexOf("execute:"));
    assert.match(params, /name: z\.string\(\)\.min\(2\)/);
    assert.match(params, /email: z\.string\(\)\.email\(\)(?!\.optional)/);
    assert.match(params, /phone: z\.string\(\)/);
    assert.match(params, /ageConfirmed: z\.literal\(true\)/);
  });
});

describe("phone reservation agent: the caller is confirmed", () => {
  it("the webhook emails and texts a confirmation for phone bookings", () => {
    assert.match(webhook, /meta\.source === '1111_phone'/);
    assert.match(webhook, /deliverReservationConfirmation\(reservationId\)/);
    assert.match(webhook, /sendText\(/);
  });

  it("confirmation delivery can never fail the webhook", () => {
    const fn = webhook.slice(webhook.indexOf("async function confirmPhoneReservation"));
    assert.match(fn, /deliverReservationConfirmation\(reservationId\)\.catch/);
    assert.match(fn, /try \{\s*await sendText/);
  });
});
