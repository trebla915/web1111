import { NextRequest, NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/firebase/admin';
import { STAFF_ROLES, authErrorResponse, requireUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/[paymentId]/status
 *
 * Polled by the confirmation page after the Stripe redirect. It was
 * unauthenticated, so anyone could enumerate PaymentIntent ids and read the
 * amount and linked reservation id.
 *
 * Access is now: the customer who made the payment, or staff. Ownership is
 * resolved from the payment document's `userId` (written by the webhook) and,
 * for documents written before that field existed, from the linked reservation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const actor = await requireUser(request);
    const { paymentId } = params;

    const paymentDoc = await adminFirestore.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const paymentData = paymentDoc.data();
    const isStaff = STAFF_ROLES.includes(actor.role);

    let ownerUid: string | undefined = paymentData?.userId;
    if (!ownerUid && paymentData?.reservationId) {
      const reservation = await adminFirestore
        .collection('reservations')
        .doc(paymentData.reservationId)
        .get();
      ownerUid = reservation.data()?.userId;
    }

    if (!isStaff && (!ownerUid || ownerUid !== actor.uid)) {
      // 404 rather than 403: the caller has not proven any relationship to this
      // payment, so confirming that the id exists would itself be a disclosure.
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: paymentDoc.id,
      status: paymentData?.status,
      amount: paymentData?.amount,
      reservationCreated: paymentData?.reservationCreated || false,
      reservationId: paymentData?.reservationId || null,
      createdAt: paymentData?.createdAt,
      updatedAt: paymentData?.updatedAt,
    });
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('[payments] status lookup failed');
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}
