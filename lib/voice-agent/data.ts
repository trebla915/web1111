/**
 * Data shaping for the phone agent's API (app/api/voice-agent/route.ts).
 * Kept free of Firebase so the rules can be tested with plain rows.
 */
import { normalizePhone, phoneLookupVariants } from '@/lib/utils/phone';

const DATE_RE = /^\d{4}-\d{2}-\d{2}/;

/** What the agent hears about an event. Every active upcoming event is listed, reservable or not. */
export type VoiceEvent = { id: string; title: string; date: string; reservationsAvailable: boolean };

type Row = Record<string, unknown>;

/** Active events dated `today` (YYYY-MM-DD at the venue) or later, soonest first. */
export function toVoiceEvents(docs: { id: string; data: Row }[], today: string): VoiceEvent[] {
  return docs.flatMap(({ id, data }) => {
    const date = typeof data.date === 'string' ? data.date : '';
    const active = !data.status || data.status === 'active';
    if (!active || !DATE_RE.test(date) || date.slice(0, 10) < today) return [];
    return [{ id, title: String(data.title ?? 'Event'), date, reservationsAvailable: data.reservationsEnabled === true }];
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/** Most `userPhone` matches read for a caller-ID hint; one caller rarely holds more. */
export const CALLER_LOOKUP_LIMIT = 50;

const OPEN_STATUSES = new Set(['pending', 'confirmed']);

/** A reservation still ahead of the caller: pending or confirmed, for today or later. */
export function isUpcomingReservation(data: Row, today: string): boolean {
  const status = String(data.status ?? 'pending').toLowerCase();
  const date = typeof data.eventDate === 'string' ? data.eventDate : '';
  return OPEN_STATUSES.has(status) && DATE_RE.test(date) && date.slice(0, 10) >= today;
}

/** Reads reservations whose `userPhone` is one of `values`, at most `limit`. */
export type ReservationsByPhone = (values: string[], limit: number) => Promise<Row[]>;

/**
 * Whether a caller-ID number might hold an upcoming reservation. Only a yes/no
 * hint to offer an SMS code: it is not verification and exposes no details.
 */
export async function hasPossibleUpcomingReservation(rawPhone: unknown, find: ReservationsByPhone, today: string): Promise<boolean> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return false;
  const rows = await find(phoneLookupVariants(phone), CALLER_LOOKUP_LIMIT);
  return rows.some((row) => isUpcomingReservation(row, today));
}
