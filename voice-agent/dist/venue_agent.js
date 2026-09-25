import { llm, log, voice } from '@livekit/agents';
import { z } from 'zod';
import { GREETING_INSTRUCTIONS, VOICE_INSTRUCTIONS } from "./instructions.js";
// Read per call so tests can import the agent without venue API credentials;
// agent.ts checks both at worker startup.
// Only the action, status, outcome and duration are logged; never headers,
// request fields or response bodies, which carry caller details and secrets.
async function callVenueApi(action, fields = {}) {
    const apiBaseUrl = process.env.VOICE_API_BASE_URL?.replace(/\/$/, '');
    const apiSecret = process.env.VOICE_AGENT_SHARED_SECRET;
    if (!apiBaseUrl || !apiSecret)
        throw new Error('The reservation system is unavailable.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const started = performance.now();
    let status;
    let ok = false;
    try {
        const response = await fetch(`${apiBaseUrl}/api/voice-agent`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiSecret}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...fields }),
            signal: controller.signal,
        });
        status = response.status;
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error ?? 'The reservation system is unavailable.');
        ok = true;
        return result;
    }
    finally {
        clearTimeout(timeout);
        log().info({ venueApi: { action, status: status ?? null, ok, durationMs: Math.round(performance.now() - started) } }, 'venue api call');
    }
}
// Tool results go straight into the model's context, so each one carries only
// what the agent speaks or passes to a later tool.
const cents = (value) => Math.round(value * 100) / 100;
export class VenueAgent extends voice.Agent {
    #call;
    // Tests pass the backend layer's instructions to exercise it with the same tools.
    constructor(instructions = VOICE_INSTRUCTIONS) {
        const call = { codeSentTo: '', verified: false, verifiedReservations: [] };
        const listEvents = llm.tool({
            name: 'list_upcoming_events',
            description: 'Get all active upcoming 11:11 events with their dates, whether or not they take table reservations. reservationsAvailable says whether tables can be booked. Call this before discussing events or dates, or checking availability.',
            parameters: z.object({}),
            execute: async () => {
                const { events } = await callVenueApi('events');
                return { events: events.map(({ id, title, date, reservationsAvailable }) => ({ id, title, date, reservationsAvailable })) };
            },
        });
        const checkAvailability = llm.tool({
            name: 'check_table_availability',
            description: 'Get current available tables, capacities, prices, and bottle minimums for an event whose reservationsAvailable is true. Always use live results before quoting.',
            parameters: z.object({ eventId: z.string().describe('Event ID from list_upcoming_events.') }),
            execute: async ({ eventId }) => {
                const { event, tables } = await callVenueApi('availability', { eventId });
                const open = tables.filter((table) => table.available).sort((a, b) => a.price - b.price || a.number - b.number);
                return {
                    event: { id: event.id, title: event.title, date: event.date },
                    availableTables: open.map(({ id, number, capacity, price, minimumBottles, location }) => ({
                        id, number, capacity, price, minimumBottles, ...(location ? { location } : {}),
                    })),
                    reservedCount: tables.length - open.length,
                };
            },
        });
        const listBottles = llm.tool({
            name: 'list_event_bottles',
            description: 'Get the current bottle menu and prices for the selected event. Use these IDs and prices when taking a booking. Only call after the caller has said they are 21 or older.',
            parameters: z.object({
                eventId: z.string(),
                ageConfirmed: z.literal(true).describe('True only after the caller explicitly said they are 21 or older.'),
            }),
            execute: async ({ eventId, ageConfirmed }) => {
                const { bottles } = await callVenueApi('bottles', { eventId, ageConfirmed });
                return { bottles: bottles.map(({ id, name, price }) => ({ id, name, price })).sort((a, b) => a.price - b.price) };
            },
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
            execute: async ({ eventId, tableId, guestCount, bottleIds }) => {
                const quote = await callVenueApi('quote', { eventId, tableId, guestCount, bottleIds });
                return {
                    event: { id: quote.event.id, title: quote.event.title, date: quote.event.date },
                    table: { id: quote.table.id, number: quote.table.number },
                    guestCount: quote.guestCount,
                    bottles: quote.bottles,
                    tablePrice: quote.tablePrice,
                    bottlesCost: quote.bottlesCost,
                    salesTax: cents(quote.salesTax),
                    gratuity: cents(quote.gratuity),
                    // Passed back unrounded as quotedTotal; the server checks it to the cent.
                    total: quote.total,
                };
            },
        });
        const sendCode = async (phone) => {
            call.codeSentTo = '';
            call.verified = false;
            call.verifiedReservations = [];
            await callVenueApi('send-lookup-code', { phone });
            call.codeSentTo = phone;
            return { sent: true, message: 'A verification code was sent. Ask the caller to read it back.' };
        };
        // Returns only a yes/no hint, never the number or reservation details. Any
        // failure reads as "unavailable" so the call carries on with a typed number.
        const checkCallerId = llm.tool({
            name: 'check_caller_id_reservation',
            description: 'When the caller asks about an existing reservation, check whether the number they are calling from may have an upcoming one. This is a hint, not verification.',
            parameters: z.object({}),
            execute: async () => {
                if (!call.callerNumber)
                    return { callerIdAvailable: false };
                try {
                    const { hasPossibleReservation } = await callVenueApi('caller-lookup', { phone: call.callerNumber });
                    return { callerIdAvailable: true, hasPossibleReservation: hasPossibleReservation === true };
                }
                catch {
                    return { callerIdAvailable: false };
                }
            },
        });
        const sendCodeToCaller = llm.tool({
            name: 'send_code_to_calling_number',
            description: 'Text a verification code to the number the caller is calling from. Call only after check_caller_id_reservation found a possible reservation and the caller said yes to receiving a code.',
            parameters: z.object({
                callerAgreed: z.literal(true).describe('True only after the caller said yes to a code at the number they are calling from.'),
            }),
            execute: async () => {
                if (!call.callerNumber)
                    return { sent: false, message: 'Caller ID is unavailable. Ask for the phone number on the reservation.' };
                return sendCode(call.callerNumber);
            },
        });
        const sendLookupCode = llm.tool({
            name: 'send_reservation_lookup_code',
            description: 'Send an SMS verification code to the phone number the caller says is on the reservation. Tell the caller a code is being sent and ask them to read it back.',
            parameters: z.object({ phone: z.string().describe('The reservation phone number in international format, for example +19152463945.') }),
            execute: async ({ phone }) => sendCode(phone),
        });
        const verifyLookupCode = llm.tool({
            name: 'verify_reservation_lookup_code',
            description: 'Verify the one-time code the caller received by text, for the number the latest code was sent to. Only share reservation information if this returns verified true.',
            parameters: z.object({ code: z.string() }),
            execute: async ({ code }) => {
                if (!call.codeSentTo)
                    return { verified: false, message: 'No code has been sent yet. Do not disclose reservation details.' };
                const result = await callVenueApi('verify-lookup-code', { phone: call.codeSentTo, code });
                call.verified = result.verified === true;
                call.verifiedReservations = call.verified ? (result.reservations ?? []) : [];
                return call.verified ? { verified: true, reservations: call.verifiedReservations } : { verified: false, message: 'That code did not match. Do not disclose reservation details.' };
            },
        });
        const readReservations = llm.tool({
            name: 'read_verified_reservations',
            description: 'Read reservation status only for the phone number verified earlier in this call. If verification has not succeeded, ask the caller to complete it first.',
            parameters: z.object({}),
            execute: async () => call.verified ? { reservations: call.verifiedReservations } : { error: 'Verify the caller by SMS before looking up reservations.' },
        });
        const createCheckout = llm.tool({
            name: 'text_reservation_payment_link',
            description: 'Create a short-lived hold and text a Stripe checkout link. Call only after the caller has confirmed the event, date, table, guest count, bottles, total, their full name, email and mobile number, said they are 21 or older, and explicitly agreed to receive the payment link by SMS.',
            parameters: z.object({
                eventId: z.string(),
                tableId: z.string(),
                guestCount: z.number().int().min(1).max(30),
                bottleIds: z.array(z.string()).max(10),
                name: z.string().min(2).max(100).describe("Caller's full name, first and last, as they confirmed it."),
                phone: z.string().describe('Mobile number the caller explicitly approved for receiving the text, in E.164 format, read back digit by digit.'),
                email: z.string().email().describe('Email address for the confirmation and door QR code, spelled back to the caller and confirmed.'),
                ageConfirmed: z.literal(true).describe('True only after the caller explicitly said they are 21 or older.'),
                smsConsent: z.literal(true).describe('True only after the caller explicitly agrees to receive the payment text.'),
                callerConfirmed: z.literal(true).describe('True only after the caller explicitly confirms the quoted booking details.'),
                quotedTotal: z.number().positive().describe('Exact total returned by quote_reservation and read back to the caller.'),
            }),
            execute: async ({ eventId, tableId, guestCount, bottleIds, name, phone, email, ageConfirmed, smsConsent, callerConfirmed, quotedTotal }) => {
                if (!callerConfirmed || !smsConsent || !ageConfirmed)
                    return { sent: false, message: 'Get explicit caller confirmation, 21+ confirmation and SMS consent first.' };
                const result = await callVenueApi('create-checkout', { eventId, tableId, guestCount, bottleIds, name, phone, email, ageConfirmed, smsConsent, callerConfirmed, quotedTotal });
                // The checkout URL is texted by the server; the agent never needs to read it.
                return { sent: result.sent, holdExpiresAt: result.expiresAt, tableNumber: result.quote.tableNumber, total: result.quote.total };
            },
        });
        super({
            instructions,
            tools: [listEvents, checkAvailability, listBottles, quoteReservation, checkCallerId, sendCodeToCaller, sendLookupCode, verifyLookupCode, readReservations, createCheckout],
        });
        this.#call = call;
    }
    /** Set once the SIP caller joins; undefined when caller ID is missing or hidden. */
    setCallerNumber(number) {
        this.#call.callerNumber = number;
    }
    async onEnter() {
        await this.session.generateReply({ instructions: GREETING_INSTRUCTIONS });
    }
}
