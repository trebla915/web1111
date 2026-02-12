import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// GET /api/reservations/[reservationId] - Fetch a specific reservation
export async function GET(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    
    // Get reservation from Firestore
    const reservationDoc = await adminFirestore
      .collection('reservations')
      .doc(reservationId)
      .get();
    
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    
    const reservationData = {
      id: reservationDoc.id,
      ...reservationDoc.data()
    };
    
    return NextResponse.json(reservationData);
  } catch (error) {
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
    console.error(`Error updating reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
  }
}

// DELETE /api/reservations/[reservationId] - Delete a specific reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    
    // Verify reservation exists
    const reservationRef = adminFirestore
      .collection('reservations')
      .doc(reservationId);
    
    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    
    // Delete the reservation
    await reservationRef.delete();
    
    return NextResponse.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error(`Error deleting reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
  }
} 