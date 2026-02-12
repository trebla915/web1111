import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// POST /api/reservations/[reservationId]/cancel - Cancel reservation and process refund
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    const { reason, refundAmount, staffName } = await request.json();

    // Verify reservation exists
    const reservationRef = adminFirestore
      .collection('reservations')
      .doc(reservationId);
    
    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservationData = reservationDoc.data();
    
    // Check if already cancelled
    if (reservationData?.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Reservation already cancelled',
        cancelledAt: reservationData.cancelledAt,
        cancelledBy: reservationData.cancelledBy
      }, { status: 400 });
    }

    // Get payment information
    const paymentId = reservationData?.paymentId;
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID found for this reservation' }, { status: 400 });
    }

    let refundId = null;
    let refundStatus = 'not_processed';

    // Process refund if amount is provided
    if (refundAmount && refundAmount > 0) {
      try {
        // Convert refund amount to cents
        const refundAmountCents = Math.round(refundAmount * 100);
        
        // Create refund through Stripe
        const refund = await stripe.refunds.create({
          payment_intent: paymentId,
          amount: refundAmountCents,
          reason: 'requested_by_customer',
          metadata: {
            reservationId: reservationId,
            reason: reason || 'Cancelled by admin',
            staffName: staffName || 'Admin',
            originalAmount: reservationData?.totalAmount?.toString() || '0'
          }
        });

        refundId = refund.id;
        refundStatus = refund.status;

        // Store refund information in Firestore
        await adminFirestore.collection('refunds').doc(refund.id).set({
          id: refund.id,
          paymentIntentId: paymentId,
          reservationId: reservationId,
          amount: refundAmount,
          amountCents: refundAmountCents,
          status: refund.status,
          reason: reason || 'Cancelled by admin',
          processedBy: staffName || 'Admin',
          createdAt: new Date().toISOString(),
          stripeRefundData: {
            id: refund.id,
            status: refund.status,
            created: refund.created
          }
        });

      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError);
        return NextResponse.json({ 
          error: 'Failed to process refund through Stripe',
          details: stripeError.message 
        }, { status: 500 });
      }
    }

    // Update reservation status to cancelled
    await reservationRef.update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: staffName || 'Admin',
      cancellationReason: reason || 'Cancelled by admin',
      refundId: refundId,
      refundAmount: refundAmount || 0,
      refundStatus: refundStatus,
      updatedAt: new Date().toISOString()
    });

    // Release the table if event and table info exists
    if (reservationData?.eventId && reservationData?.tableId) {
      try {
        const tableRef = adminFirestore
          .collection('events')
          .doc(reservationData.eventId)
          .collection('tables')
          .doc(reservationData.tableId);
        
        await tableRef.update({
          reserved: false,
          reservedBy: null,
          reservationId: null,
          updatedAt: new Date().toISOString()
        });
      } catch (tableError) {
        console.error('Error releasing table:', tableError);
        // Don't fail the whole operation if table release fails
      }
    }
    
    return NextResponse.json({ 
      message: 'Reservation cancelled successfully',
      cancelledAt: new Date().toISOString(),
      cancelledBy: staffName || 'Admin',
      refund: refundId ? {
        id: refundId,
        amount: refundAmount,
        status: refundStatus
      } : null
    });
  } catch (error) {
    console.error(`Error cancelling reservation ${params.reservationId}:`, error);
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
  }
} 