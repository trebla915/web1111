import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/reservations/event/[id] - Fetch reservations for a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Get reservations for this event
    const reservationsSnapshot = await adminFirestore
      .collection('reservations')
      .where('eventId', '==', id)
      .get();
    
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(reservations);
  } catch (error) {
    console.error(`Error fetching reservations for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
} 