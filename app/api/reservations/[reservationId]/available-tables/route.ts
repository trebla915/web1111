import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/reservations/[reservationId]/available-tables
// Returns available (unreserved) tables for the reservation's event, plus the currently reserved table
export async function GET(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;

    const reservationDoc = await adminFirestore
      .collection('reservations')
      .doc(reservationId)
      .get();

    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data()!;

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Reservation is cancelled' }, { status: 400 });
    }

    if (reservation.status === 'checked-in') {
      return NextResponse.json({ error: 'Cannot change table after check-in' }, { status: 400 });
    }

    const eventId = reservation.eventId;

    // Fetch all tables for the event
    const tablesSnapshot = await adminFirestore
      .collection('events')
      .doc(eventId)
      .collection('tables')
      .get();

    const tables = tablesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter: show unreserved tables + the customer's current table (for reference)
    const availableTables = tables.filter(
      (t: any) => !t.reserved || t.id === reservation.tableId
    );

    // Fetch event details for context
    const eventDoc = await adminFirestore.collection('events').doc(eventId).get();
    const event = eventDoc.exists ? { id: eventDoc.id, ...eventDoc.data() } : null;

    return NextResponse.json({
      tables: availableTables,
      currentTableId: reservation.tableId,
      currentTableNumber: reservation.tableNumber,
      event,
      reservation: {
        id: reservationDoc.id,
        userName: reservation.userName,
        guestCount: reservation.guestCount,
        totalAmount: reservation.totalAmount,
        bottles: reservation.bottles,
        mixers: reservation.mixers,
      },
    });
  } catch (error) {
    console.error(`Error fetching available tables for reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch available tables' }, { status: 500 });
  }
}
