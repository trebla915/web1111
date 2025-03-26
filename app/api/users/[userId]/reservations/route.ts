import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/users/[userId]/reservations - Get all reservations for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Verify user exists
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get all reservations for this user
    const reservationsSnapshot = await adminFirestore
      .collection('reservations')
      .where('userId', '==', userId)
      .get();
    
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get event details for each reservation
    const eventIds = [...new Set(reservations.map(res => res.eventId))];
    const eventsData: Record<string, any> = {};
    
    if (eventIds.length > 0) {
      const eventsSnapshot = await adminFirestore
        .collection('events')
        .where('__name__', 'in', eventIds)
        .get();
      
      eventsSnapshot.docs.forEach(doc => {
        eventsData[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });
    }
    
    // Add event details to each reservation
    const reservationsWithEventDetails = reservations.map(reservation => ({
      ...reservation,
      event: eventsData[reservation.eventId] || null
    }));
    
    return NextResponse.json(reservationsWithEventDetails);
  } catch (error) {
    console.error(`Error fetching reservations for user ${params.userId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch user reservations' }, { status: 500 });
  }
} 