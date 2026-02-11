import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { notifyVipCheckin } from '@/lib/utils/dispatcher';

// GET /api/reservations/[reservationId]/check-in - Get reservation details for check-in
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

    // Get event details
    const eventDoc = await adminFirestore
      .collection('events')
      .doc(reservationData.eventId)
      .get();

    const eventData = eventDoc.exists ? eventDoc.data() : null;
    
    return NextResponse.json({
      reservation: reservationData,
      event: eventData ? { id: eventDoc.id, ...eventData } : null
    });
  } catch (error) {
    console.error(`Error fetching reservation for check-in ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch reservation details' }, { status: 500 });
  }
}

// POST /api/reservations/[reservationId]/check-in - Check in a reservation
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    const body = await request.json().catch(() => ({}));
    const staffName = (body.staffName && String(body.staffName).trim()) || 'QR Scan';
    
    const reservationRef = adminFirestore
      .collection('reservations')
      .doc(reservationId);

    // Use a transaction to prevent race conditions from double submissions
    const result = await adminFirestore.runTransaction(async (tx) => {
      const reservationDoc = await tx.get(reservationRef);

      if (!reservationDoc.exists) {
        return { status: 404, body: { error: 'Reservation not found' } } as const;
      }

      const reservationData = reservationDoc.data()!;

      if (reservationData.status === 'checked-in') {
        return {
          status: 400,
          body: {
            error: 'Reservation already checked in',
            checkedInAt: reservationData.checkedInAt,
            checkedInBy: reservationData.checkedInBy,
          },
        } as const;
      }

      const checkedInAt = new Date().toISOString();

      tx.update(reservationRef, {
        status: 'checked-in',
        checkedInAt,
        checkedInBy: staffName,
        updatedAt: checkedInAt,
      });

      return {
        status: 200,
        body: {
          message: 'Reservation checked in successfully',
          checkedInAt,
          checkedInBy: staffName,
        },
        reservationData,
        checkedInAt,
      } as const;
    });

    if (result.status === 200 && 'reservationData' in result) {
      // Dispatcher notification is fire-and-forget to ensure check-in is never blocked.
      notifyVipCheckin({
        table: result.reservationData.tableNumber ?? '',
        name: result.reservationData.userName ?? '',
        partySize: result.reservationData.guestCount ?? 0,
        eventName: result.reservationData.eventName ?? '',
        reservationId,
        checkedInAt: result.checkedInAt,
        checkedInBy: staffName,
      }).catch((err) =>
        console.error('Dispatcher notify failed', err.message)
      );
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error(`Error checking in reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to check in reservation' }, { status: 500 });
  }
} 