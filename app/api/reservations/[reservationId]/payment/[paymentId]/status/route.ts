import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/reservations/[reservationId]/payment/[paymentId]/status - Fetch payment status
export async function GET(
  request: NextRequest,
  { params }: { params: { reservationId: string; paymentId: string } }
) {
  try {
    const { reservationId, paymentId } = params;
    
    // Verify reservation exists
    const reservationDoc = await adminFirestore
      .collection('reservations')
      .doc(reservationId)
      .get();
    
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    
    // Get payment information
    const paymentDoc = await adminFirestore
      .collection('payments')
      .doc(paymentId)
      .get();
    
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Verify this payment belongs to this reservation
    const paymentData = paymentDoc.data();
    if (paymentData?.reservationId !== reservationId) {
      return NextResponse.json(
        { error: 'This payment does not belong to the specified reservation' }, 
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      id: paymentDoc.id,
      status: paymentData?.status,
      amount: paymentData?.amount,
      createdAt: paymentData?.createdAt,
      updatedAt: paymentData?.updatedAt
    });
  } catch (error) {
    console.error(`Error fetching payment status for payment ${params.paymentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
} 