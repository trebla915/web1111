import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

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
    
    // Verify reservation exists
    const reservationRef = adminFirestore
      .collection('reservations')
      .doc(reservationId);
    
    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservationData = reservationDoc.data();
    
    // Check if already checked in
    if (reservationData?.status === 'checked-in') {
      return NextResponse.json({ 
        error: 'Reservation already checked in',
        checkedInAt: reservationData.checkedInAt,
        checkedInBy: reservationData.checkedInBy
      }, { status: 400 });
    }
    
    // Update reservation status to checked-in
    await reservationRef.update({
      status: 'checked-in',
      checkedInAt: new Date().toISOString(),
      checkedInBy: staffName,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      message: 'Reservation checked in successfully',
      checkedInAt: new Date().toISOString(),
      checkedInBy: staffName
    });
  } catch (error) {
    console.error(`Error checking in reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to check in reservation' }, { status: 500 });
  }
} 