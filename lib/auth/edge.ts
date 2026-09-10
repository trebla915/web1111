import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

/**
 * Firebase ID token verification for the Edge runtime.
 *
 * `middleware.ts` cannot use `firebase-admin` (Node-only), which is why the
 * previous implementation base64-decoded the token and trusted a `userInfo`
 * cookie. `jose` verifies the RS256 signature against Google's published keys,
 * so the role in the token can actually be trusted.
 *
 * Defence in depth for navigation only — route handlers re-verify with the
 * Admin SDK (`lib/auth/server.ts`). Middleware never grants data access.
 */

/** Google's JWKS for Firebase ID tokens (RS256, rotated by Google). */
export const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export type EdgeRole = "user" | "promoter" | "staff" | "admin";

export interface EdgeIdentity {
  uid: string;
  role: EdgeRole;
}

/**
 * Builds a verifier bound to a key source and a project.
 *
 * Exported as a factory so tests can supply a local JWKS and exercise the
 * *accept* path with genuinely signed tokens — verifying a real signature, not
 * a mock of one. Production uses `verifyIdTokenEdge` below.
 */
export function createIdTokenVerifier(options: {
  jwks: JWTVerifyGetKey;
  projectId: string;
  /** Seconds of tolerance for clock drift between Vercel edge and Google. */
  clockToleranceSeconds?: number;
}) {
  const { jwks, projectId, clockToleranceSeconds = 60 } = options;

  return async function verify(token: string | undefined): Promise<EdgeIdentity | null> {
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, jwks, {
        // Firebase ID tokens are issued by securetoken for this project and
        // are audienced to the project id. Checking both stops a token minted
        // for a *different* Firebase project from being accepted here.
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        // RS256 only. Without this, a token could claim `alg: none` or a
        // symmetric algorithm and bypass the asymmetric signature check.
        algorithms: ["RS256"],
        clockTolerance: clockToleranceSeconds,
      });

      const uid = typeof payload.sub === "string" ? payload.sub : "";
      if (!uid) return null;

      // `auth_time` and `exp` are enforced by jose. Firebase additionally
      // requires sub === user_id; we key off `sub`, which Firebase always sets.
      const claimed = (payload as JWTPayload & { role?: unknown }).role;
      return { uid, role: normalizeEdgeRole(claimed) };
    } catch {
      // Expired, malformed, revoked-key, wrong project, or bad signature.
      // Returning null (never throwing) keeps middleware from failing open or
      // 500-ing the whole site on a transient JWKS fetch error.
      return null;
    }
  };
}

export function normalizeEdgeRole(claim: unknown): EdgeRole {
  return claim === "admin" || claim === "promoter" || claim === "staff" ? claim : "user";
}

const remoteJwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

/** Production verifier. */
export async function verifyIdTokenEdge(token: string | undefined): Promise<EdgeIdentity | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  return createIdTokenVerifier({ jwks: remoteJwks, projectId })(token);
}
