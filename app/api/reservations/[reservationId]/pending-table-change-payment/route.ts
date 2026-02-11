import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

/**
 * GET /api/reservations/[reservationId]/pending-table-change-payment
 *
 * Returns clientSecret and amountDue for a reservation that has a pending table-change payment
 * (from fix-table-change upgrade). Used so the customer can pay on the change-table page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;

    const reservationDoc = await adminFirestore
      .collection('reservations')
      .doc(reservationId)
      .get();

    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data()!;
    const paymentIntentId = reservation.pendingTableChangePaymentIntentId as string | undefined;
    const amountDue = Number(reservation.pendingTableChangeAmount ?? 0);

    if (!paymentIntentId || amountDue <= 0) {
      return NextResponse.json(
        { error: 'No pending table change payment for this reservation' },
        { status: 404 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.metadata?.reservationId !== reservationId) {
      return NextResponse.json({ error: 'Invalid pending payment' }, { status: 400 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountDue,
    });
  } catch (err: unknown) {
    console.error(`Error fetching pending table change payment for ${params.reservationId}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch' },
      { status: 500 }
    );
  }
}
