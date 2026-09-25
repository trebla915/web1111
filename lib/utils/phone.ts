/**
 * Phone numbers, normalized one way for the whole backend.
 *
 * Phone bookings store E.164 (`+19155550123`), but the web contact step saves
 * `userPhone` exactly as typed, so lookups also try the common US spellings.
 */

const E164_RE = /^\+[1-9]\d{7,14}$/;
const FORMATTED_RE = /^\+?[\d\s().-]+$/;

/**
 * E.164 for a typed, spoken or caller-ID number; null when it is missing,
 * hidden ("anonymous", "restricted"…) or not a dialable number. Ten digits,
 * or eleven starting with 1, are read as US/Canada.
 */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!FORMATTED_RE.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, '');
  const e164 = trimmed.startsWith('+') ? `+${digits}`
    : digits.length === 10 ? `+1${digits}`
    : digits.length === 11 && digits.startsWith('1') ? `+${digits}`
    : '';
  if (!E164_RE.test(e164)) return null;
  if (e164.startsWith('+1') && e164.length !== 12) return null;
  return e164;
}

/** Every stored spelling of an E.164 number that a `userPhone` match should find (at most 30, Firestore's `in` limit). */
export function phoneLookupVariants(e164: string): string[] {
  const nanp = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  if (!nanp) return [e164, e164.slice(1)];
  const [, area, prefix, line] = nanp;
  const local = `${area}${prefix}${line}`;
  return [
    e164,
    `1${local}`,
    local,
    `+1 ${area} ${prefix} ${line}`,
    `+1 (${area}) ${prefix}-${line}`,
    `+1 (${area})${prefix}-${line}`,
    `+1-${area}-${prefix}-${line}`,
    `+1 ${area}-${prefix}-${line}`,
    `+1.${area}.${prefix}.${line}`,
    `1-${area}-${prefix}-${line}`,
    `1 (${area}) ${prefix}-${line}`,
    `1 ${area} ${prefix} ${line}`,
    `(${area}) ${prefix}-${line}`,
    `(${area})${prefix}-${line}`,
    `(${area}) ${prefix} ${line}`,
    `${area}-${prefix}-${line}`,
    `${area}.${prefix}.${line}`,
    `${area} ${prefix} ${line}`,
    `${area} ${prefix}-${line}`,
  ];
}
