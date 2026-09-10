import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import {
  ADMIN_ROLES,
  STAFF_ROLES,
  authErrorResponse,
  requireRole,
  requireSelfOrRole,
  requireUser,
} from '@/lib/auth/server';
import { recordAudit } from '@/lib/auth/audit';

export const dynamic = 'force-dynamic';

// GET /api/reservations/[reservationId] - Fetch a specific reservation
export async function GET(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    
    // Authenticate BEFORE touching the database: an anonymous caller must not
    // be able to make the server do a Firestore read (cost + a timing oracle
    // for which reservation ids exist).
    await requireUser(request);

    const reservationDoc = await adminFirestore
      .collection('reservations')
      .doc(reservationId)
      .get();

    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Ownership comes from the stored document, never from the request.
    await requireSelfOrRole(request, reservationDoc.data()?.userId, STAFF_ROLES);

    const reservationData = {
      id: reservationDoc.id,
      ...reservationDoc.data()
    };

    return NextResponse.json(reservationData);
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error(`Error fetching reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
  }
}

// PATCH /api/reservations/[reservationId] - Update reservation (e.g. contact info)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    // Same rule as GET: prove identity before doing any read or parse work.
    await requireUser(request);
    const body = await request.json();

    const allowed = ['userEmail', 'userName', 'userPhone'];
    const updates: Record<string, string> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        const v = body[key];
        if (typeof v !== 'string') continue;
        if (key === 'userEmail' && v.trim() === '') continue;
        updates[key] = v.trim();
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const reservationRef = adminFirestore.collection('reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data()!;
    const userId = reservation.userId as string | undefined;

    // The customer may correct their own contact details; admins may correct
    // anyone's. The field allowlist above already prevents touching price,
    // status or payment fields through this endpoint.
    const actor = await requireSelfOrRole(request, userId, ADMIN_ROLES);

    updates.updatedAt = new Date().toISOString();
    await reservationRef.update(updates);

    if (userId) {
      const userReservationRef = adminFirestore
        .collection('users')
        .doc(userId)
        .collection('reservations')
        .doc(reservationId);
      const userResDoc = await userReservationRef.get();
      if (userResDoc.exists) {
        await userReservationRef.update(updates);
      }
    }

    const updated = (await reservationRef.get()).data();
    return NextResponse.json({ ...updated, id: reservationId });
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error(`Error updating reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
  }
}

// DELETE /api/reservations/[reservationId] - Delete a reservation, release its table,
// and clean up the mirrored doc under users/{userId}/reservations, all in one batch.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    // Destroying a booking is an admin action and is recorded.
    const actor = await requireRole(request, ADMIN_ROLES, { checkRevoked: true });
    await recordAudit({
      action: 'reservation.delete',
      actorUid: actor.uid,
      actorRole: actor.role,
      targetType: 'reservation',
      targetId: params.reservationId,
    });

    const { reservationId } = params;

    const reservationRef = adminFirestore
      .collection('reservations')
      .doc(reservationId);

    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data()!;
    const { userId, eventId, tableId } = reservation as {
      userId?: string;
      eventId?: string;
      tableId?: string;
    };

    const batch = adminFirestore.batch();
    batch.delete(reservationRef);

    if (userId) {
      const userReservationRef = adminFirestore
        .collection('users')
        .doc(userId)
        .collection('reservations')
        .doc(reservationId);
      batch.delete(userReservationRef);
    }

    if (eventId && tableId) {
      const tableRef = adminFirestore
        .collection('events')
        .doc(eventId)
        .collection('tables')
        .doc(tableId);
      batch.update(tableRef, {
        reserved: false,
        reservationId: null,
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error(`Error deleting reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
  }
}