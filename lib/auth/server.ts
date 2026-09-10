import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { adminAuth } from "@/lib/firebase/admin";

/**
 * Server-side authentication and authorization for API route handlers.
 *
 * Every protected route must call one of the `require*` helpers. Prior to this
 * module, 36 of 41 route handlers performed no identity check at all while
 * using the Firebase Admin SDK, which bypasses Firestore security rules — so
 * the route handler was the only possible enforcement point and it was absent.
 *
 * Trust model
 * -----------
 * The ONLY accepted proof of identity is a Firebase ID token verified against
 * Google's signing keys by the Admin SDK. We deliberately do not trust:
 *   - the `userInfo` cookie (client-writable; was the basis of the admin gate),
 *   - unverified JWT payloads (base64 is encoding, not authentication),
 *   - any role, uid or email supplied in a request body or query string,
 *   - middleware having "already checked" — middleware is UX routing only.
 *
 * The token is read from the `authToken` cookie (set by AuthProvider) or an
 * `Authorization: Bearer` header, so existing same-origin `fetch` calls keep
 * working without change.
 */

import {
  decideEffectiveRole,
  decideOwnerOrRole,
  decideRole,
  normalizeRole,
  type AuthContext,
  type Decision,
  type Role,
} from "@/lib/auth/policy";

export type { Role };

export interface AuthedUser {
  uid: string;
  email: string | null;
  role: Role;
}

/** Roles permitted to administer events, pricing, users and refunds. */
export const ADMIN_ROLES: Role[] = ["admin"];
/** Roles permitted to see operational booking data across customers. */
export const STAFF_ROLES: Role[] = ["admin", "promoter", "staff"];

export class AuthError extends Error {
  constructor(readonly status: 401 | 403, message: string) {
    super(message);
  }
}

/**
 * Extracts the bearer token. Exported for tests.
 *
 * The `Authorization` header wins over the cookie so a caller can act
 * deliberately (mobile clients, server-to-server) rather than inheriting
 * whatever session the browser happens to carry.
 */
export function readTokenFrom(
  authorizationHeader: string | null,
  cookieValue: string | null | undefined
): string | null {
  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.slice(7).trim() || null;
  }
  const cookie = cookieValue?.trim();
  return cookie ? cookie : null;
}

/**
 * Maps verified token claims to an application identity. Exported for tests.
 * `role` passes through `normalizeRole`, so an unexpected claim value can only
 * ever degrade to `user`.
 */
export function identityFromClaims(claims: {
  uid: string;
  email?: string | null;
  role?: unknown;
}): AuthedUser {
  return { uid: claims.uid, email: claims.email ?? null, role: normalizeRole(claims.role) };
}

function readToken(request: NextRequest): string | null {
  return readTokenFrom(
    request.headers.get("authorization"),
    request.cookies.get("authToken")?.value
  );
}

/**
 * Verifies the caller's ID token.
 *
 * `checkRevoked` forces a lookup against Firebase so that a disabled account or
 * a revoked refresh token stops working immediately rather than at the end of
 * the token's one-hour lifetime. Use it for anything that moves money or
 * changes privileges.
 */
export async function getAuthedUser(
  request: NextRequest,
  { checkRevoked = false }: { checkRevoked?: boolean } = {}
): Promise<AuthedUser | null> {
  const token = readToken(request);
  if (!token) return null;

  try {
    // `checkRevoked` makes an extra call to Firebase so a disabled account or
    // a revoked refresh token stops working immediately instead of at the end
    // of the token's one-hour life. Used on privilege and money operations.
    const decoded = await adminAuth.verifyIdToken(token, checkRevoked);
    const identity = identityFromClaims(decoded);
    // A verified token proves WHO the caller is. What they may DO requires all
    // three of: verified non-anonymous sign-in, allowlist membership, and the
    // intended claim. This mirrors the Firestore ruleset exactly.
    return {
      ...identity,
      role: effectiveRole(identity.uid, identity.role, {
        emailVerified: decoded.email_verified === true,
        signInProvider: decoded.firebase?.sign_in_provider ?? null,
      }),
    };
  } catch {
    // Expired, malformed, revoked, or signed by someone else. No detail is
    // returned to the caller — an attacker learns nothing about why.
    return null;
  }
}

/**
 * TRANSITIONAL privilege source — an explicitly verified allowlist.
 *
 * Neither existing role source can be trusted:
 *
 *   - Firestore `role` fields were writable by an unauthenticated API for ~17
 *     months, AND were written from the browser on every sign-in for any
 *     address containing the substring "admin" (`notadmin@`, `sysadmin@`, even
 *     `badminton@`). Sign-up is self-service, so a Firestore `role: admin` is
 *     not evidence that anyone approved it.
 *
 *   - Custom claims were settable by the same unauthenticated API, so a claim
 *     is not evidence either.
 *
 * During the transition, privilege therefore comes from ADMIN_UID_ALLOWLIST —
 * a list of account IDs a human has reviewed and approved — and from nothing
 * else. A verified login is still required; the allowlist only decides role.
 *
 * FAIL CLOSED: if the allowlist is unset or empty, no request is granted a
 * privileged role and every admin/staff operation is unavailable. That is
 * deliberate — better unavailable than wrongly granted.
 *
 * Set TRUST_CUSTOM_CLAIMS=true to retire the allowlist once the forensics
 * review is complete and claims have been re-established from a trusted path.
 */
const TRUST_CUSTOM_CLAIMS = process.env.TRUST_CUSTOM_CLAIMS === "true";

const ALLOWLIST: ReadonlyMap<string, Role> = new Map(
  (process.env.ADMIN_UID_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      // "uid" defaults to admin; "uid:staff" / "uid:promoter" set it explicitly.
      const [uid, role] = entry.split(":");
      const normalized = normalizeRole(role ?? "admin");
      return [uid, normalized === "user" ? "admin" : normalized] as const;
    })
);

/**
 * The role this request may act with.
 *
 * Until TRUST_CUSTOM_CLAIMS is enabled, a privileged role comes only from the
 * reviewed allowlist — a token claiming `admin` that is not on the list acts as
 * an ordinary user.
 */
export type { AuthContext };

/**
 * The role this request may act with — see `decideEffectiveRole` in policy.ts
 * for the three conditions. This wrapper adds only the operator-facing warning,
 * so the decision itself stays pure and exhaustively testable.
 */
export function effectiveRole(
  uid: string,
  claimedRole: Role,
  context: AuthContext
): Role {
  const { role, reason } = decideEffectiveRole(
    uid,
    claimedRole,
    context,
    ALLOWLIST,
    TRUST_CUSTOM_CLAIMS
  );

  if (reason !== "granted" && claimedRole !== "user") {
    // Visible on purpose. "not-allowlisted" is either a legitimate admin
    // missing from the list, or an account that granted itself a role during
    // the exposure window — the second is worth investigating.
    const message = {
      unverified: "[auth] privileged claim ignored — sign-in is not verified",
      "not-allowlisted": "[auth] privileged claim ignored — uid not on the reviewed allowlist",
      "claim-missing": "[auth] allowlisted uid lacks the intended claim — acting as user",
    }[reason];
    console.warn(message, { uid, claimedRole, ...context });
  }

  return role;
}

/** True when privileged operations are unavailable because nobody is approved. */
export function privilegedOperationsAvailable(): boolean {
  return TRUST_CUSTOM_CLAIMS || ALLOWLIST.size > 0;
}

/** Any signed-in user. */
export async function requireUser(
  request: NextRequest,
  opts?: { checkRevoked?: boolean }
): Promise<AuthedUser> {
  const user = await getAuthedUser(request, opts);
  if (!user) throw new AuthError(401, "Authentication required");
  return user;
}

/** A signed-in user holding one of `roles`. */
export async function requireRole(
  request: NextRequest,
  roles: Role[],
  opts?: { checkRevoked?: boolean }
): Promise<AuthedUser> {
  const user = await getAuthedUser(request, opts);
  if (!user) throw new AuthError(401, "Authentication required");
  if (decideRole(user, roles).allow) return user;

  if (!privilegedOperationsAvailable()) {
    // Deliberate, and said plainly rather than looking like a permissions bug.
    throw new AuthError(
      403,
      "Privileged operations are unavailable until administrators have been verified"
    );
  }

  throw new AuthError(403, "Insufficient permissions");
}

/**
 * The resource owner, or a privileged role. Ownership is always evaluated
 * against the *verified* uid, never against a uid supplied by the caller.
 */
export async function requireSelfOrRole(
  request: NextRequest,
  ownerUid: string | null | undefined,
  roles: Role[],
  opts?: { checkRevoked?: boolean }
): Promise<AuthedUser> {
  const user = await getAuthedUser(request, opts);
  if (!user) throw new AuthError(401, "Authentication required");
  if (decideOwnerOrRole(user, ownerUid, roles).allow) return user;

  throw new AuthError(403, "Insufficient permissions");
}

/** Turns a pure Decision into the thrown AuthError the handlers catch. */
function enforce(decision: Decision): void {
  if (!decision.allow) throw new AuthError(decision.status, decision.reason);
}

/**
 * Converts an AuthError into a response. Any other error is re-thrown so a
 * genuine bug is not silently reported as an authorization failure.
 *
 * Ownership failures deliberately return 403 rather than 404: the caller has
 * already proven identity, and the resource id came from their own request.
 */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
