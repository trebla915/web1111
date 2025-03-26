import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';
import { Reservation } from '@/types/reservation';
import { adminFirestore } from '@/lib/firebase/admin';

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

// POST /reservations - Create a new reservation
export async function POST(request: Request) {
  try {
    const reservationData = await request.json();
    const response = await apiClient.post('/reservations', reservationData);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
} 