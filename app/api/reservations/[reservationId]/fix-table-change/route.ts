import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import Stripe from 'stripe';
import { sendTableChangeNotification, sendTableChangePaymentRequired } from '@/lib/utils/sendEmail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SERVICE_FEE_RATE = 0.1;

/**
 * POST /api/reservations/[reservationId]/fix-table-change
 *
 * For reservations that were already moved (previousTableId set) but price difference was not
 * applied (e.g. old admin override with tableChangeAmount: 0). Refunds or charges the difference
 * and sends the customer an email.
 *
 * - Downgrade (new table cheaper): process refund, update reservation, send email with refund amount.
 * - Upgrade (new table more expensive): create PaymentIntent, store pending on reservation,
 *   send "pay price difference" email, return needsPayment + clientSecret so customer can pay.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;

    const reservationRef = adminFirestore.collection('reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data()!;
    const previousTableId = reservation.previousTableId as string | undefined;
    const tableId = reservation.tableId as string;
    const eventId = reservation.eventId as string;

    if (!previousTableId || !tableId || !eventId) {
      return NextResponse.json(
        { error: 'Reservation has no table change to fix (missing previousTableId or tableId)' },
        { status: 400 }
      );
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot fix cancelled reservation' }, { status: 400 });
    }

    const eventRef = adminFirestore.collection('events').doc(eventId);
    const oldTableRef = eventRef.collection('tables').doc(previousTableId);
    const newTableRef = eventRef.collection('tables').doc(tableId);

    const [oldTableDoc, newTableDoc] = await Promise.all([oldTableRef.get(), newTableRef.get()]);
    if (!oldTableDoc.exists || !newTableDoc.exists) {
      return NextResponse.json({ error: 'Table not found for this event' }, { status: 404 });
    }

    const oldTable = oldTableDoc.data()!;
    const newTable = newTableDoc.data()!;
    const oldPrice = Number(oldTable.price ?? 0);
    const newPrice = Number(newTable.price ?? 0);

    const tableDiff = newPrice - oldPrice;
    const tableDiffWithFee = Math.round((tableDiff * (1 + SERVICE_FEE_RATE)) * 100) / 100;

    async function getEventNameAndDate() {
      let eventName = reservation.eventName || 'Event';
      let eventDate = reservation.eventDate || reservation.createdAt || '';
      if (reservation.eventId && (!eventName || eventName === 'Event' || !eventDate)) {
        try {
          const eventDoc = await adminFirestore.collection('events').doc(reservation.eventId).get();
          if (eventDoc.exists) {
            const ed = eventDoc.data();
            if (ed?.title) eventName = ed.title;
            if (ed?.date) eventDate = ed.date;
          }
        } catch (e) {
          console.error('Error fetching event:', e);
        }
      }
      return { eventName, eventDate };
    }

    const customerEmail = reservation.userEmail;
    const customerName = reservation.userName || 'Guest';
    const previousTableNumber = oldTable.number ?? reservation.previousTableNumber ?? 0;
    const newTableNumber = newTable.number ?? reservation.tableNumber ?? 0;

    // Downgrade: refund the difference
    if (tableDiffWithFee < 0) {
      const refundAmount = Math.abs(tableDiffWithFee);
      const refundAmountCents = Math.round(refundAmount * 100);
      const paymentId = reservation.paymentId as string;
      if (!paymentId) {
        return NextResponse.json({ error: 'No payment ID on reservation' }, { status: 400 });
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
        amount: refundAmountCents,
        reason: 'requested_by_customer',
        metadata: {
          reservationId,
          reason: 'Table change fix (downgrade)',
          previousTableId,
          newTableId: tableId,
        },
      });

      await reservationRef.update({
        tableChangeRefundId: refund.id,
        tableChangeAmount: -refundAmount,
        updatedAt: new Date().toISOString(),
      });

      const userResRef = adminFirestore
        .collection('users')
        .doc(reservation.userId)
        .collection('reservations')
        .doc(reservationId);
      const userDoc = await userResRef.get();
      if (userDoc.exists) {
        await userResRef.update({
          tableChangeRefundId: refund.id,
          tableChangeAmount: -refundAmount,
          updatedAt: new Date().toISOString(),
        });
      }

      await adminFirestore.collection('refunds').doc(refund.id).set({
        id: refund.id,
        paymentIntentId: paymentId,
        reservationId,
        amount: refundAmount,
        amountCents: refundAmountCents,
        status: refund.status,
        reason: 'Table change fix (downgrade)',
        createdAt: new Date().toISOString(),
      });

      const { eventName, eventDate } = await getEventNameAndDate();
      if (customerEmail && typeof customerEmail === 'string') {
        await sendTableChangeNotification({
          reservationId,
          customerName,
          customerEmail,
          eventName,
          eventDate,
          previousTableNumber,
          newTableNumber,
          refundAmount,
          changedByAdmin: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Refund of $${refundAmount.toFixed(2)} processed. Customer notified by email.`,
        refund: { id: refund.id, amount: refundAmount },
      });
    }

    // Upgrade: charge the difference (create PaymentIntent, send email, store pending)
    if (tableDiffWithFee > 0) {
      const amountCents = Math.round(tableDiffWithFee * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          reservationId,
          type: 'table_change_fix',
          previousTableId,
          newTableId: tableId,
          amountDue: String(tableDiffWithFee),
        },
      });

      await reservationRef.update({
        pendingTableChangePaymentIntentId: paymentIntent.id,
        pendingTableChangeAmount: tableDiffWithFee,
        updatedAt: new Date().toISOString(),
      });

      const { eventName, eventDate } = await getEventNameAndDate();
      if (customerEmail && typeof customerEmail === 'string') {
        await sendTableChangePaymentRequired({
          reservationId,
          customerName,
          customerEmail,
          eventName,
          eventDate,
          amountDue: tableDiffWithFee,
          previousTableNumber,
          newTableNumber,
        });
      }

      return NextResponse.json({
        needsPayment: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountDue: tableDiffWithFee,
        message: 'Email sent to customer with payment link. Table change will be marked complete when they pay.',
      });
    }

    // Same price: just send notification (no refund/charge)
    const { eventName, eventDate } = await getEventNameAndDate();
    if (customerEmail && typeof customerEmail === 'string') {
      await sendTableChangeNotification({
        reservationId,
        customerName,
        customerEmail,
        eventName,
        eventDate,
        previousTableNumber,
        newTableNumber,
        changedByAdmin: true,
      });
    }
    return NextResponse.json({
      success: true,
      message: 'No price difference. Customer notified of table change.',
    });
  } catch (err: unknown) {
    console.error(`Error fixing table change for reservation ${params.reservationId}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fix table change' },
      { status: 500 }
    );
  }
}
