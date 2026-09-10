import "server-only";

import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";

/**
 * Turns a Firestore snapshot into a plain object with its `id` merged in.
 *
 * The route handlers all wrote `{ id: doc.id, ...doc.data() }` by hand.
 * `data()` is typed `DocumentData | undefined`, so spreading it collapsed the
 * result to `{ id: string }` and every subsequent field read
 * (`reservation.eventId`, `table.capacity`, …) failed to type-check. Callers
 * pass the shape they expect; the cast happens in exactly one place.
 */
export function withId<T = DocumentData>(
  snap: DocumentSnapshot | QueryDocumentSnapshot
): T & { id: string } {
  return { id: snap.id, ...(snap.data() ?? {}) } as T & { id: string };
}
