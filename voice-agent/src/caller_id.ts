import { ParticipantKind } from '@livekit/rtc-node';

type Participant = { kind: ParticipantKind; attributes: Record<string, string> };

/**
 * The inbound caller's number from LiveKit's documented SIP attribute, or
 * undefined for non-SIP participants and hidden or missing numbers. It is
 * passed to the venue API as-is; the backend owns normalization. Caller ID can
 * be spoofed, so it only hints at a reservation and never replaces SMS verification.
 */
export function callerNumberFrom(participant: Participant): string | undefined {
  if (participant.kind !== ParticipantKind.SIP) return undefined;
  const number = participant.attributes['sip.phoneNumber']?.trim();
  return number && /\d/.test(number) ? number : undefined;
}
