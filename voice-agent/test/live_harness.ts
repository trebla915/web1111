// Shared setup for the *.live.test.ts files: the real agent and backend model
// in LiveKit's text mode, with every tool mocked so nothing reaches the venue
// API, Twilio or Stripe. Skipped without OPENAI_API_KEY (npm test loads it
// from .env.local).
import { initializeLogger, voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { after } from 'node:test';
import { BACKEND_INSTRUCTIONS, BACKEND_MODEL, VOICE_INSTRUCTIONS } from '../src/instructions.ts';
import { VenueAgent } from '../src/venue_agent.ts';

initializeLogger({ pretty: false, level: 'warn' });

// Belt and braces: with no venue API configured, an unmocked tool fails instead of calling production.
delete process.env.VOICE_API_BASE_URL;
delete process.env.VOICE_AGENT_SHARED_SECRET;

export const skip = process.env.OPENAI_API_KEY ? false : 'OPENAI_API_KEY is not set';

export const LAYERS = { voice: VOICE_INSTRUCTIONS, backend: BACKEND_INSTRUCTIONS };

export const model = skip ? undefined : new openai.responses.LLM({ model: BACKEND_MODEL });
// judge() forces temperature 0, which the reasoning backend model rejects, so grading uses a chat model.
export const grader = skip ? undefined : new openai.LLM({ model: 'gpt-4.1-mini' });
after(async () => { await model?.aclose(); await grader?.aclose(); });

export const EVENT = { id: 'evt_neon', title: 'Neon Nights', date: '2026-10-03', reservationsAvailable: true };
export const NOT_RESERVABLE = { id: 'evt_sol', title: 'DJ Sol', date: '2026-10-10', reservationsAvailable: false };
export const TABLE = { id: 'tbl_7', number: 7, capacity: 8, price: 500, minimumBottles: 2, location: 'Main floor' };

/** Tools that book, pay, text or touch reservations; they fail unless a test mocks them. */
export const TRANSACTIONAL = [
  'list_event_bottles', 'quote_reservation', 'text_reservation_payment_link',
  'check_caller_id_reservation', 'send_code_to_calling_number', 'send_reservation_lookup_code',
  'verify_reservation_lookup_code', 'read_verified_reservations',
];

type Mock = (...args: any[]) => unknown;

function mocks(overrides: Record<string, Mock>): Record<string, Mock> {
  const refuse = () => new Error('This tool must not be called in this test.');
  return {
    list_upcoming_events: () => ({ events: [EVENT, NOT_RESERVABLE] }),
    check_table_availability: () => ({ event: EVENT, availableTables: [TABLE], reservedCount: 3 }),
    ...Object.fromEntries(TRANSACTIONAL.map((name) => [name, refuse])),
    ...overrides,
  };
}

// Skips the greeting so each run holds only the reply to the caller's turn.
class TurnAgent extends VenueAgent {
  async onEnter(): Promise<void> {}
}

export type Say = (userInput: string) => Promise<voice.testing.RunResult>;

/**
 * A multi-turn call. Mocks are keyed by agent class, so each call gets its own.
 * They are deliberately never disposed: disposing restores the registry as it
 * was at registration, which would drop mocks for calls running in parallel.
 */
export async function conversation(instructions: string, overrides: Record<string, Mock>, script: (say: Say) => Promise<void>) {
  const CallAgent = class extends TurnAgent {};
  const session = new voice.AgentSession({ llm: model });
  voice.testing.withMockTools(CallAgent, mocks(overrides));
  await session.start({ agent: new CallAgent(instructions) });
  try {
    await script((userInput) => session.run({ userInput }).wait());
  } finally {
    await session.close();
  }
}

export async function turn(instructions: string, userInput: string, overrides: Record<string, Mock> = {}) {
  let result: voice.testing.RunResult | undefined;
  await conversation(instructions, overrides, async (say) => { result = await say(userInput); });
  return result!;
}

export const calls = (result: voice.testing.RunResult) =>
  result.events.flatMap((event) => event.type === 'function_call' ? [event.item] : []);

export const callNames = (result: voice.testing.RunResult) => calls(result).map((call) => call.name);

export const reply = (result: voice.testing.RunResult) =>
  result.events.flatMap((event) => event.type === 'message' && event.item.role === 'assistant' ? [event.item.textContent ?? ''] : []).join(' ');

export const normalize = (text: string) => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9:]+/g, ' ').trim();
