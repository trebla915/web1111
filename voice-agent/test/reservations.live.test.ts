// Event discovery and caller-ID-assisted reservation lookup against the real
// backend model, on both instruction layers. Tools are mocked: no SMS is sent
// and no reservation, hold or payment is created.
import { voice } from '@livekit/agents';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CALLER_ID_OFFER, NOT_RESERVABLE_REPLY } from '../src/instructions.ts';
import { callNames, calls, conversation, LAYERS, normalize, NOT_RESERVABLE, reply, skip, turn } from './live_harness.ts';

const GOOD_CODE = '123456';
const RESERVATION = { reference: 'res_abc', eventName: 'Neon Nights', eventDate: '2026-10-03', tableNumber: 7, status: 'confirmed', totalAmount: 812.5 };
const DETAILS = /Neon Nights|table 7|812|confirmed|October (3|third)/i;
const BOOKING_TOOLS = ['check_table_availability', 'list_event_bottles', 'quote_reservation', 'text_reservation_payment_link'];
const SEND_TOOLS = ['send_code_to_calling_number', 'send_reservation_lookup_code'];

const lookup = (result: object) => ({ check_caller_id_reservation: () => result });
const possibleMatch = {
  ...lookup({ callerIdAvailable: true, hasPossibleReservation: true }),
  send_code_to_calling_number: () => ({ sent: true, message: 'A verification code was sent. Ask the caller to read it back.' }),
  send_reservation_lookup_code: () => ({ sent: true, message: 'A verification code was sent. Ask the caller to read it back.' }),
  verify_reservation_lookup_code: ({ code }: { code: string }) => code === GOOD_CODE ? { verified: true, reservations: [RESERVATION] } : { verified: false },
  read_verified_reservations: () => ({ reservations: [RESERVATION] }),
};

const sent = (result: voice.testing.RunResult) => callNames(result).filter((name) => SEND_TOOLS.includes(name));
const offersCode = (result: voice.testing.RunResult) => normalize(reply(result)).includes(normalize(CALLER_ID_OFFER));
const OCTOBER_10 = /October (10|tenth)/i;

for (const [layer, instructions] of Object.entries(LAYERS)) {
  describe(`${layer} layer: events`, { skip, concurrency: true }, () => {
    it('names every upcoming event and its date, reservable or not', async () => {
      const result = await turn(instructions, 'What events are coming up?');
      assert.deepEqual(callNames(result), ['list_upcoming_events']);
      const text = reply(result);
      assert.match(text, /Neon Nights/, text);
      assert.match(text, /DJ Sol/, text);
      assert.match(text, OCTOBER_10, text);
      assert.doesNotMatch(text, /reserv|book|table/i, 'availability is only mentioned when asked');
    });

    it('explains a non-reservable event exists but cannot be booked', async () => {
      const result = await turn(instructions, `Can I book a table for ${NOT_RESERVABLE.title}?`);
      assert.deepEqual(callNames(result).filter((name) => BOOKING_TOOLS.includes(name)), [], 'no availability, quote or payment tool for a non-reservable event');
      const text = normalize(reply(result));
      const [before, after] = NOT_RESERVABLE_REPLY.split('[spoken date]').map(normalize);
      assert.ok(text.includes(before) && text.includes(after), reply(result));
      assert.match(reply(result), OCTOBER_10, reply(result));
      assert.doesNotMatch(reply(result), /doesn.?t exist|no such event|not (on|in) (our|the) (list|schedule)/i);
    });
  });

  describe(`${layer} layer: caller ID`, { skip, concurrency: true }, () => {
    it('matching caller ID: offers a code, sends it on yes, reveals details only after verification', async () => {
      await conversation(instructions, possibleMatch, async (say) => {
        const asked = await say("Hi, I'm calling to check on my reservation.");
        assert.ok(callNames(asked).includes('check_caller_id_reservation'), JSON.stringify(callNames(asked)));
        assert.deepEqual(sent(asked), [], 'never text before the caller agrees');
        assert.ok(offersCode(asked), reply(asked));
        assert.doesNotMatch(reply(asked), DETAILS);

        const agreed = await say('Yes, please send it.');
        assert.deepEqual(sent(agreed), ['send_code_to_calling_number']);
        assert.ok(!callNames(agreed).includes('verify_reservation_lookup_code'));
        assert.match(reply(agreed), /code/i, reply(agreed));
        assert.doesNotMatch(reply(agreed), DETAILS);

        const verified = await say('The code is 1 2 3 4 5 6.');
        const verify = calls(verified).find((call) => call.name === 'verify_reservation_lookup_code');
        assert.equal(verify && JSON.parse(verify.args).code, GOOD_CODE);
        assert.match(reply(verified), /Neon Nights/, reply(verified));
      });
    });

    it('matching caller ID: a caller who declines is not texted', async () => {
      await conversation(instructions, possibleMatch, async (say) => {
        assert.ok(offersCode(await say("I'm calling about my reservation.")));
        const declined = await say("No, please don't text me.");
        assert.deepEqual(sent(declined), []);
        assert.doesNotMatch(reply(declined), DETAILS);
      });
    });

    it('matching caller ID: the caller can use a different number', async () => {
      await conversation(instructions, possibleMatch, async (say) => {
        assert.ok(offersCode(await say("I'm calling about my reservation.")));
        const other = await say("It's actually under a different number: 915-555-0199.");
        assert.ok(!sent(other).includes('send_code_to_calling_number'), 'must not text the calling number');
        const typed = calls(other).find((call) => call.name === 'send_reservation_lookup_code');
        if (typed) assert.match(JSON.parse(typed.args).phone.replace(/\D/g, ''), /9155550199$/);
        else assert.match(reply(other), /555|0199|number|code/i, reply(other));
        assert.doesNotMatch(reply(other), DETAILS);
      });
    });

    for (const [label, result] of [
      ['no matching reservation', { callerIdAvailable: true, hasPossibleReservation: false }],
      ['caller ID hidden or missing', { callerIdAvailable: false }],
    ] as const) {
      it(`${label}: asks for the reservation's number without revealing the lookup`, async () => {
        const asked = await turn(instructions, "I'm calling about my reservation.", lookup(result));
        assert.ok(callNames(asked).includes('check_caller_id_reservation'));
        assert.deepEqual(sent(asked), []);
        assert.ok(!offersCode(asked), reply(asked));
        assert.match(reply(asked), /number/i, reply(asked));
        assert.doesNotMatch(reply(asked), /(no|don.?t|couldn.?t|didn.?t) (find|see|have)[^.]*reservation|no reservation/i, 'must not say whether the number has a reservation');
      });
    }

    it('a failed caller-ID lookup does not stop the call', async () => {
      await conversation(instructions, { check_caller_id_reservation: () => new Error('The reservation system is unavailable.') }, async (say) => {
        const asked = await say("I'm calling about my reservation.");
        assert.deepEqual(sent(asked), []);
        assert.match(reply(asked), /number|246.?3945/i, reply(asked));
        const events = await say('Okay. What events are coming up?');
        assert.ok(callNames(events).includes('list_upcoming_events'));
        assert.match(reply(events), /Neon Nights/, reply(events));
      });
    });
  });
}
