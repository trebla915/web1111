import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminFirestore } from '@/lib/firebase/admin';
import { ADMIN_ROLES, STAFF_ROLES, authErrorResponse } from '@/lib/auth/server';
import { loadAuthorizedReservation, NotFoundError } from '@/lib/auth/reservation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reservations/[reservationId]/complete-table-change-payment
 *
 * After customer pays the pending table-change difference (from fix-table-change upgrade).
 * Verifies the PaymentIntent and updates the reservation (tableChangeInvoiceId, tableChangeAmount, clear pending).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    // Finalises a paid table change for the owner.
    await loadAuthorizedReservation(request, params.reservationId, ADMIN_ROLES, { checkRevoked: true });
    const { reservationId } = params;
    const body = await request.json().catch(() => ({}));
    const paymentIntentId = body.paymentIntentId as string | undefined;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

    const reservationRef = adminFirestore.collection('reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data()!;
    const pendingId = reservation.pendingTableChangePaymentIntentId;
    const pendingAmount = Number(reservation.pendingTableChangeAmount ?? 0);

    if (pendingId !== paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment does not match reservation pending table change' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed', status: paymentIntent.status },
        { status: 400 }
      );
    }
    if (paymentIntent.metadata?.reservationId !== reservationId || paymentIntent.metadata?.type !== 'table_change_fix') {
      return NextResponse.json({ error: 'Invalid payment for this reservation' }, { status: 400 });
    }

    const previousTotal = Number(reservation.totalAmount ?? 0);
    const newTotal = Math.round((previousTotal + pendingAmount) * 100) / 100;

    const updateData = {
      tableChangeInvoiceId: paymentIntentId,
      tableChangeAmount: pendingAmount,
      totalAmount: newTotal,
      pendingTableChangePaymentIntentId: null,
      pendingTableChangeAmount: null,
      updatedAt: new Date().toISOString(),
    };

    await reservationRef.update(updateData);

    const userId = reservation.userId;
    if (userId) {
      const userResRef = adminFirestore
        .collection('users')
        .doc(userId)
        .collection('reservations')
        .doc(reservationId);
      const userDoc = await userResRef.get();
      if (userDoc.exists) {
        await userResRef.update(updateData);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Table change payment recorded.',
    });
  } catch (err: unknown) {
    console.error(`Error completing table change payment for ${params.reservationId}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to complete' },
      { status: 500 }
    );
  }
}
