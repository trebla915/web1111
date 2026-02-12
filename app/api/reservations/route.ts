import { NextRequest, NextResponse } from 'next/server';
import { Reservation } from '@/types/reservation';
import { adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// GET /api/reservations - Fetch reservations grouped by event
export async function GET() {
  try {
    // Get all reservations
    const reservationsSnapshot = await adminFirestore
      .collection('reservations')
      .get();
    
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Group reservations by eventId
    const groupedReservations: { [eventId: string]: any[] } = {};
    
    for (const reservation of reservations) {
      const eventId = reservation.eventId;
      if (!groupedReservations[eventId]) {
        groupedReservations[eventId] = [];
      }
      groupedReservations[eventId].push(reservation);
    }
    
    return NextResponse.json(groupedReservations);
  } catch (error) {
    console.error('Error fetching reservations grouped by event:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

// POST endpoint removed - Reservations are now created exclusively via Stripe webhooks
// This ensures proper payment validation and prevents bypassing bottle requirements 