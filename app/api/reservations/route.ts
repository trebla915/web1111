import { NextRequest, NextResponse } from 'next/server';
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
    const requestData = await request.json();
    
    // Extract reservation data from the request
    const { paymentId, reservationDetails } = requestData;
    
    if (!reservationDetails) {
      return NextResponse.json({ error: 'Missing reservation details' }, { status: 400 });
    }
    
    // Validate required fields
    if (!reservationDetails.userId || !reservationDetails.eventId || !reservationDetails.tableId) {
      return NextResponse.json({ error: 'Missing required reservation fields' }, { status: 400 });
    }
    
    // Add the reservation to Firestore
    const reservationRef = await adminFirestore
      .collection('reservations')
      .add({
        ...reservationDetails,
        paymentId: paymentId || reservationDetails.paymentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    
    // TODO: Mark table as reserved in the tables collection
    // This would require updating the table document to set reserved: true
    // Note: This is optional as the table status can be determined by checking reservations
    
    // Get the created reservation with its ID
    const createdReservation = {
      id: reservationRef.id,
      ...reservationDetails,
      paymentId: paymentId || reservationDetails.paymentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Successfully created reservation:', {
      id: createdReservation.id,
      eventId: createdReservation.eventId,
      tableId: createdReservation.tableId,
      userId: createdReservation.userId
    });
    
    return NextResponse.json(createdReservation, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
} 