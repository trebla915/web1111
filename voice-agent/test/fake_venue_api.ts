// A stand-in for /api/voice-agent, installed over global fetch so the agent's
// real tools run end to end without the network, Twilio, Stripe or Firestore.
import { VenueAgent } from '../src/venue_agent.ts';

export const MATCHING_CALLER = '+19155550123';
export const OTHER_CALLER = '+19155550999';
export const GOOD_CODE = '123456';
export const RESERVATION = { reference: 'res_abc', eventName: 'Neon Nights', eventDate: '2026-10-03', tableNumber: 7, status: 'confirmed', totalAmount: 812.5 };
export const EVENTS = [
  { id: 'evt_neon', title: 'Neon Nights', date: '2026-10-03', reservationsAvailable: true, description: 'internal' },
  { id: 'evt_sol', title: 'DJ Sol', date: '2026-10-10', reservationsAvailable: false },
];

export type VenueRequest = { action: string; [field: string]: unknown };

/** Routes venue API calls to canned answers; `failLookup` makes caller-lookup error. */
export function installFakeVenueApi(options: { failLookup?: 'status' | 'network' } = {}): VenueRequest[] {
  process.env.VOICE_API_BASE_URL = 'https://venue.test';
  process.env.VOICE_AGENT_SHARED_SECRET = 'test-secret';
  const requests: VenueRequest[] = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as VenueRequest;
    requests.push(body);
    const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    switch (body.action) {
      case 'events': return reply({ events: EVENTS });
      case 'caller-lookup':
        if (options.failLookup === 'network') throw new TypeError('fetch failed');
        if (options.failLookup === 'status') return reply({ error: 'The reservation service is temporarily unavailable. Please call the venue.' }, 500);
        return reply({ hasPossibleReservation: body.phone === MATCHING_CALLER });
      case 'send-lookup-code': return reply({ sent: true });
      case 'verify-lookup-code':
        return reply(body.code === GOOD_CODE ? { verified: true, reservations: [RESERVATION] } : { verified: false });
      default: return reply({ error: 'Unknown action.' }, 400);
    }
  };
  return requests;
}

/** Calls one of the agent's tools the way the session would. */
export function tool(agent: VenueAgent, name: string) {
  const fn = agent.toolCtx.getFunctionTool(name);
  if (!fn) throw new Error(`no tool ${name}`);
  return (args: Record<string, unknown> = {}) => fn.execute(args as never, {} as never) as Promise<Record<string, unknown>>;
}
