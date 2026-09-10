import "server-only";

import type { NextRequest } from "next/server";

import { adminFirestore } from "@/lib/firebase/admin";
import { AuthError, requireUser, type AuthedUser, type Role } from "@/lib/auth/server";

/**
 * Loads a reservation and authorizes the caller against it in one step.
 *
 * Ownership is always taken from the stored `userId`, so a caller cannot assert
 * ownership by supplying a uid. Used by every `/api/reservations/[id]/*` route
 * so the ownership rule is written once rather than re-derived per handler.
 *
 * Throws `AuthError` (401/403) or `NotFoundError`.
 */
export class NotFoundError extends Error {}

export async function loadAuthorizedReservation(
  request: NextRequest,
  reservationId: string,
  allowedRoles: Role[],
  opts?: { checkRevoked?: boolean }
): Promise<{ actor: AuthedUser; reservation: FirebaseFirestore.DocumentSnapshot }> {
  const actor = await requireUser(request, opts);

  const snapshot = await adminFirestore.collection("reservations").doc(reservationId).get();
  if (!snapshot.exists) throw new NotFoundError("Reservation not found");

  const ownerUid = snapshot.data()?.userId as string | undefined;
  const isOwner = Boolean(ownerUid) && ownerUid === actor.uid;
  if (isOwner || allowedRoles.includes(actor.role)) {
    return { actor, reservation: snapshot };
  }

  // `actor.role` has already been resolved through the reviewed allowlist in
  // getAuthedUser, so there is no second, weaker source to consult here.
  throw new AuthError(403, "Insufficient permissions");
}
