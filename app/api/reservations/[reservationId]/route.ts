import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

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