import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/payments/[paymentId]/status - Fetch payment status and reservation status
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    
    // Get payment information from Firebase Functions collection
    const paymentDoc = await adminFirestore
      .collection('payments')
      .doc(paymentId)
      .get();
    
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    const paymentData = paymentDoc.data();
    
    return NextResponse.json({
      id: paymentDoc.id,
      status: paymentData?.status,
      amount: paymentData?.amount,
      reservationCreated: paymentData?.reservationCreated || false,
      reservationId: paymentData?.reservationId || null,
      createdAt: paymentData?.createdAt,
      updatedAt: paymentData?.updatedAt
    });
  } catch (error) {
    console.error(`Error fetching payment status for payment ${params.paymentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
} 