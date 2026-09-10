/**
 * Pure authorization decisions.
 *
 * Deliberately free of Next, Firebase and I/O so the rules can be tested
 * exhaustively without mocking a request or a database. The route guards in
 * `server.ts` do the I/O (verify the token, load the document) and then call
 * these functions to make the decision.
 */

export type Role = "user" | "promoter" | "staff" | "admin";

export const ROLES: Role[] = ["user", "promoter", "staff", "admin"];

/** Only a real, known role is honoured; anything else degrades to `user`. */
export function normalizeRole(claim: unknown): Role {
  return claim === "admin" || claim === "promoter" || claim === "staff" ? claim : "user";
}

export type Decision =
  | { allow: true }
  | { allow: false; status: 401 | 403; reason: string };

const DENY_ANON: Decision = { allow: false, status: 401, reason: "Authentication required" };
const DENY_ROLE: Decision = { allow: false, status: 403, reason: "Insufficient permissions" };

/** Any authenticated identity. */
export function decideAuthenticated(actor: { uid: string } | null): Decision {
  return actor ? { allow: true } : DENY_ANON;
}

/** Membership of one of `allowedRoles`. */
export function decideRole(
  actor: { uid: string; role: Role } | null,
  allowedRoles: Role[]
): Decision {
  if (!actor) return DENY_ANON;
  return allowedRoles.includes(actor.role) ? { allow: true } : DENY_ROLE;
}

/**
 * Resource owner, or a permitted role.
 *
 * `ownerUid` must come from the stored record. A null/undefined owner never
 * matches, so a document without an owner cannot be claimed by asserting an
 * empty uid.
 */
export function decideOwnerOrRole(
  actor: { uid: string; role: Role } | null,
  ownerUid: string | null | undefined,
  allowedRoles: Role[]
): Decision {
  if (!actor) return DENY_ANON;
  if (ownerUid && actor.uid === ownerUid) return { allow: true };
  return allowedRoles.includes(actor.role) ? { allow: true } : DENY_ROLE;
}

/**
 * Refund sizing.
 *
 * All amounts in minor units. The refundable ceiling is derived from the
 * settled charge, never from the caller — the previous implementation refunded
 * whatever `refundAmount` the request body asked for.
 */
export type RefundDecision =
  | { ok: true; amountCents: number }
  | { ok: false; status: 400; reason: string; refundableCents?: number };

export function decideRefund(input: {
  requestedAmountCents: number;
  amountCapturedCents: number;
  amountAlreadyRefundedCents: number;
}): RefundDecision {
  const { requestedAmountCents, amountCapturedCents, amountAlreadyRefundedCents } = input;

  if (!Number.isFinite(requestedAmountCents) || !Number.isInteger(requestedAmountCents)) {
    return { ok: false, status: 400, reason: "Refund amount must be a whole number of cents" };
  }
  if (requestedAmountCents <= 0) {
    return { ok: false, status: 400, reason: "Refund amount must be positive" };
  }

  const refundableCents = amountCapturedCents - amountAlreadyRefundedCents;
  if (refundableCents <= 0) {
    return { ok: false, status: 400, reason: "This payment has already been fully refunded" };
  }
  if (requestedAmountCents > refundableCents) {
    return { ok: false, status: 400, reason: "Refund exceeds refundable balance", refundableCents };
  }
  return { ok: true, amountCents: requestedAmountCents };
}

/**
 * How long a cancellation claim is honoured before it is treated as abandoned.
 *
 * A request that dies between claiming and finalising would otherwise lock the
 * booking out of cancellation permanently. Long enough to cover a Stripe call
 * plus retries; short enough that an operator is not blocked for long.
 */
export const CLAIM_STALE_AFTER_MS = 2 * 60 * 1000;

/**
 * Converts a dollar amount to integer cents, refusing anything that is not a
 * clean 2-decimal money value.
 *
 * `Math.round(x * 100)` alone silently accepts 10.005 and binary-float noise;
 * money must not be approximated. Returns null when the input is not valid.
 */
export function dollarsToCents(amount: unknown): number | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  const cents = Math.round(amount * 100);
  // Reject values with sub-cent precision, e.g. 10.005 -> 1000.5 -> 1001.
  if (Math.abs(amount * 100 - cents) > 1e-6) return null;
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

/**
 * Stable idempotency key for a cancellation refund.
 *
 * Derived only from the reservation id, so concurrent requests and client
 * retries collapse onto one Stripe refund object instead of refunding twice.
 */
export function cancellationRefundIdempotencyKey(reservationId: string): string {
  return `reservation-cancel-refund:${reservationId}`;
}


/** Identity facts taken from a VERIFIED Firebase ID token. */
export interface AuthContext {
  /** `email_verified` from the verified token. */
  emailVerified: boolean;
  /** `firebase.sign_in_provider` from the verified token, if present. */
  signInProvider: string | null;
}

/**
 * A non-anonymous sign-in with a verified email address.
 *
 * Mirrors `verifiedSignIn()` in the Firestore ruleset. An absent or false
 * `email_verified` fails closed.
 */
export function isVerifiedSignIn(context: AuthContext): boolean {
  return context.emailVerified === true && context.signInProvider !== "anonymous";
}

/**
 * The role a request may act with — the single privilege decision.
 *
 * Requires THREE independent conditions, each of which must hold:
 *
 *   1. VERIFIED AUTHENTICATION — non-anonymous, email verified.
 *   2. ALLOWLIST MEMBERSHIP — the uid is one a human reviewed. The same uids
 *      are pinned into the Firestore ruleset; both layers must agree.
 *   3. THE INTENDED CLAIM — the token's role claim matches the role the
 *      allowlist approved. A listed uid whose token carries no claim, or a
 *      different one, acts as an ordinary user.
 *
 * Neither source of authority is trusted alone: a claim on an unlisted account
 * grants nothing, and a listed account without the claim grants nothing.
 *
 * FAIL CLOSED — an empty allowlist grants no privileged role at all.
 *
 * @param trustClaims retires the allowlist once claims come from a trusted
 *   path. Condition 1 still applies.
 */
export function decideEffectiveRole(
  uid: string,
  claimedRole: Role,
  context: AuthContext,
  allowlist: ReadonlyMap<string, Role>,
  trustClaims = false
): { role: Role; reason: "granted" | "unverified" | "not-allowlisted" | "claim-missing" } {
  if (!isVerifiedSignIn(context)) {
    return { role: "user", reason: "unverified" };
  }
  if (trustClaims) return { role: claimedRole, reason: "granted" };

  const approved = allowlist.get(uid);
  if (!approved) return { role: "user", reason: "not-allowlisted" };
  if (claimedRole !== approved) return { role: "user", reason: "claim-missing" };
  return { role: approved, reason: "granted" };
}
