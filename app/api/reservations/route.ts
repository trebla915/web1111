import { NextRequest, NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/firebase/admin';
import { STAFF_ROLES, authErrorResponse, requireRole } from '@/lib/auth/server';
import { withId } from '@/lib/firebase/docs';

export const dynamic = 'force-dynamic';

/** Hard ceiling so a single call cannot read the whole collection. */
const MAX_LIMIT = 200;

/**
 * GET /api/reservations — every reservation, grouped by event.
 *
 * This returned the entire reservations collection — including every
 * customer's name, email and phone — to anonymous callers. Verified in
 * production on 2026-09-09: HTTP 200, 23,590 bytes, no credentials.
 *
 * Now restricted to staff/admin and bounded by an explicit limit.
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireRole(request, STAFF_ROLES, { checkRevoked: true });

    const url = new URL(request.url);
    const requested = Number(url.searchParams.get('limit') ?? MAX_LIMIT);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), MAX_LIMIT) : MAX_LIMIT;
    const eventId = url.searchParams.get('eventId');

    // Deliberately NOT ordered in the query.
    //
    // Firestore excludes documents that lack the field being ordered on, so
    // `orderBy('createdAt')` silently hides any reservation written without
    // that field — including anything created by the legacy backend or before
    // the field existed. An admin list that quietly omits bookings is worse
    // than an unsorted one, so ordering happens in memory instead, where a
    // missing value sorts last rather than disappearing.
    const base = adminFirestore.collection('reservations');
    const query = eventId ? base.where('eventId', '==', eventId).limit(limit) : base.limit(limit);

    const snapshot = await query.get();
    const reservations = snapshot.docs
      .map((doc) => withId<{ eventId?: string; createdAt?: string }>(doc))
      .sort((a, b) => {
        const at = (a as { createdAt?: string }).createdAt ?? '';
        const bt = (b as { createdAt?: string }).createdAt ?? '';
        return bt.localeCompare(at); // newest first; missing values sort last
      });

    const groupedReservations: Record<string, unknown[]> = {};
    for (const reservation of reservations) {
      const key = reservation.eventId ?? 'unassigned';
      (groupedReservations[key] ||= []).push(reservation);
    }

    return NextResponse.json({
      reservations: groupedReservations,
      count: reservations.length,
      limit,
      truncated: reservations.length === limit,
      viewerRole: actor.role,
    });
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('[reservations] list failed');
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}
