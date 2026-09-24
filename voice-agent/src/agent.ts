import { cli, defineAgent, llm, ServerOptions, voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const apiBaseUrl = process.env.VOICE_API_BASE_URL?.replace(/\/$/, '');
const apiSecret = process.env.VOICE_AGENT_SHARED_SECRET;

if (!apiBaseUrl || !apiSecret) {
  throw new Error('Set VOICE_API_BASE_URL and VOICE_AGENT_SHARED_SECRET before starting the agent.');
}

async function callVenueApi<T>(action: string, fields: Record<string, unknown> = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${apiBaseUrl}/api/voice-agent`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...fields }),
      signal: controller.signal,
    });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? 'The reservation system is unavailable.');
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

class VenueAgent extends voice.Agent {
  constructor() {
    let verifiedPhone = '';
    let verifiedReservations: unknown[] = [];

    const listEvents = llm.tool({
      name: 'list_upcoming_events',
      description: 'Get real upcoming events that currently accept table reservations. Call this before discussing dates or checking availability.',
      parameters: z.object({}),
      execute: async () => callVenueApi('events'),
    });

    const checkAvailability = llm.tool({
      name: 'check_table_availability',
      description: 'Get current available tables, capacities, prices, and bottle minimums for a specific event. Always use live results before quoting.',
      parameters: z.object({ eventId: z.string().describe('Event ID from list_upcoming_events.') }),
      execute: async ({ eventId }) => callVenueApi('availability', { eventId }),
    });

    const listBottles = llm.tool({
      name: 'list_event_bottles',
      description: 'Get the current bottle menu and prices for the selected event. Use these IDs and prices when taking a booking.',
      parameters: z.object({ eventId: z.string() }),
      execute: async ({ eventId }) => callVenueApi('bottles', { eventId }),
    });

    const quoteReservation = llm.tool({
      name: 'quote_reservation',
      description: 'Calculate the authoritative current total for a specific available table, guest count, and bottle selection. Read this quote to the caller before requesting confirmation.',
      parameters: z.object({
        eventId: z.string(),
        tableId: z.string(),
        guestCount: z.number().int().min(1).max(30),
        bottleIds: z.array(z.string()).max(10),
      }),
      execute: async ({ eventId, tableId, guestCount, bottleIds }) => callVenueApi('quote', { eventId, tableId, guestCount, bottleIds }),
    });

    const sendLookupCode = llm.tool({
      name: 'send_reservation_lookup_code',
      description: 'Send an SMS verification code to the phone number the caller says is on the reservation. Tell the caller a code is being sent and ask them to read it back.',
      parameters: z.object({ phone: z.string().describe('The reservation phone number in international format, for example +19152463945.') }),
      execute: async ({ phone }) => {
        await callVenueApi('send-lookup-code', { phone });
        return { sent: true, message: 'A verification code was sent. Ask the caller to read it back.' };
      },
    });

    const verifyLookupCode = llm.tool({
      name: 'verify_reservation_lookup_code',
      description: 'Verify the one-time code the caller received by text. Only share reservation information if this returns verified true.',
      parameters: z.object({ phone: z.string(), code: z.string() }),
      execute: async ({ phone, code }) => {
        const result = await callVenueApi<{ verified: boolean; reservations?: unknown[] }>('verify-lookup-code', { phone, code });
        verifiedPhone = result.verified ? phone : '';
        verifiedReservations = result.verified ? (result.reservations ?? []) : [];
        return result.verified ? { verified: true, reservations: verifiedReservations } : { verified: false, message: 'That code did not match. Do not disclose reservation details.' };
      },
    });

    const readReservations = llm.tool({
      name: 'read_verified_reservations',
      description: 'Read reservation status only for the phone number verified earlier in this call. If verification has not succeeded, ask the caller to complete it first.',
      parameters: z.object({}),
      execute: async () => verifiedPhone ? { reservations: verifiedReservations } : { error: 'Verify the caller by SMS before looking up reservations.' },
    });

    const createCheckout = llm.tool({
      name: 'text_reservation_payment_link',
      description: 'Create a short-lived hold and text a Stripe checkout link. Call only after the caller has confirmed the event, date, table, guest count, bottles, total, and explicitly agreed to receive the payment link by SMS.',
      parameters: z.object({
        eventId: z.string(),
        tableId: z.string(),
        guestCount: z.number().int().min(1).max(30),
        bottleIds: z.array(z.string()).max(10),
        name: z.string().min(1).max(100),
        phone: z.string().describe('Mobile number the caller explicitly approved for receiving the text, in E.164 format.'),
        email: z.string().email().optional().describe('Optional email address supplied by the caller.'),
        smsConsent: z.literal(true).describe('True only after the caller explicitly agrees to receive the payment text.'),
        callerConfirmed: z.literal(true).describe('True only after the caller explicitly confirms the quoted booking details.'),
        quotedTotal: z.number().positive().describe('Exact total returned by quote_reservation and read back to the caller.'),
      }),
      execute: async ({ eventId, tableId, guestCount, bottleIds, name, phone, email, smsConsent, callerConfirmed, quotedTotal }) => {
        if (!callerConfirmed || !smsConsent) return { sent: false, message: 'Get explicit caller confirmation and SMS consent first.' };
        return callVenueApi('create-checkout', { eventId, tableId, guestCount, bottleIds, name, phone, email, smsConsent, callerConfirmed, quotedTotal });
      },
    });

    super({
      instructions: `You are the concise, friendly phone host for 11:11 EPTX, a 21+ nightclub at 9740 Dyer Street, El Paso, TX 79924. The venue phone number is (915) 246-3945. The venue runs special events only; callers should check each event flyer for its schedule. Venue features include premium sound and lighting, multiple bar areas, VIP bottle service, a spacious dance floor, and professional security. Clear bags of any size are permitted; all persons, bags, and personal items may be searched. Prohibited items include oversized bags, weapons, controlled substances, marijuana products, eye drops and nasal spray, vitamins and supplements, non-prescription medicines, outside food/drink/liquor including water, cameras/GoPros, selfie sticks, cologne/perfume, chewing tobacco, and whistles. Do not guess about dress code, age exceptions, parking, or hours. Help callers with current events, live table availability, capacities, table prices, and bottle minimums. Use tools for all dates, menus, availability, reservation status, quotes, and booking actions. For booking, gather the event, an available table, guest count, bottle selection meeting its minimum, name, and mobile number. Call quote_reservation and read back its exact total and booking details. Explain that the table is held for 30 minutes while they pay; ask the caller to explicitly confirm the quoted booking and agree to receive a text. Only then call text_reservation_payment_link with that exact quoted total. Never say a reservation is confirmed until a tool result or later status check confirms payment. For reservation lookup, send an SMS code and verify it before sharing details. Do not ask callers to read card numbers aloud; Stripe handles payment through the secure link. Keep replies brief and natural. If the caller asks for staff, cannot verify, or something fails, give them (915) 246-3945.`,
      tools: [listEvents, checkAvailability, listBottles, quoteReservation, sendLookupCode, verifyLookupCode, readReservations, createCheckout],
    });
  }

  async onEnter(): Promise<void> {
    await this.session.generateReply({ instructions: 'Greet the caller as 11:11 EPTX and ask what you can help them with.' });
  }
}

export default defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      llm: new openai.realtime.GPTLiveModel({
        voice: 'marin',
        responsesOptions: {
          model: 'gpt-5.6-luna',
          instructions: 'Use the registered venue tools whenever current database information or a transactional action is needed. Tool results are authoritative. Never invent successful payment, availability, or verification.',
        },
      }),
    });
    await session.start({ agent: new VenueAgent(), room: ctx.room });
    await ctx.connect();
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: '1111-phone-agent' }));
