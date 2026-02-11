import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SERVICE_FEE_RATE = 0.1;

/**
 * POST /api/reservations/[reservationId]/change-table
 *
 * Body (initiate change): { newTableId: string }
 * Body (complete after payment): { newTableId: string, paymentIntentId: string }
 * Body (admin override): { newTableId: string, adminOverride: true } - swap table with no charge/refund
 *
 * - If new table costs more: returns { needsPayment: true, clientSecret, amountDue }; frontend collects payment then POSTs again with paymentIntentId.
 * - If new table costs same/less: performs swap, refunds difference, returns { success: true }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    const body = await request.json();
    const { newTableId, paymentIntentId, adminOverride } = body;

    if (!newTableId || typeof newTableId !== 'string') {
      return NextResponse.json({ error: 'newTableId is required' }, { status: 400 });
    }

    const reservationRef = adminFirestore.collection('reservations').doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const reservation = reservationDoc.data()!;
    const eventId = reservation.eventId as string;
    const currentTableId = reservation.tableId as string;

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Reservation is cancelled' }, { status: 400 });
    }
    if (reservation.status === 'checked-in') {
      return NextResponse.json({ error: 'Cannot change table after check-in' }, { status: 400 });
    }

    if (currentTableId === newTableId) {
      return NextResponse.json({ error: 'Selected table is already your current table' }, { status: 400 });
    }

    const eventRef = adminFirestore.collection('events').doc(eventId);
    const oldTableRef = eventRef.collection('tables').doc(currentTableId);
    const newTableRef = eventRef.collection('tables').doc(newTableId);

    const [oldTableDoc, newTableDoc] = await Promise.all([oldTableRef.get(), newTableRef.get()]);

    if (!oldTableDoc.exists || !newTableDoc.exists) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const oldTable = oldTableDoc.data()!;
    const newTable = newTableDoc.data()!;
    const oldPrice = Number(oldTable.price ?? 0);
    const newPrice = Number(newTable.price ?? 0);

    // Admin override: swap table with no charge or refund
    if (adminOverride === true) {
      if (newTable.reserved) {
        return NextResponse.json({ error: 'That table is already reserved' }, { status: 409 });
      }
      await adminFirestore.runTransaction(async (transaction) => {
        const newTableSnap = await transaction.get(newTableRef);
        if (!newTableSnap.exists || newTableSnap.data()?.reserved) {
          throw new Error('NEW_TABLE_NO_LONGER_AVAILABLE');
        }
        transaction.update(oldTableRef, {
          reserved: false,
          reservedBy: null,
          reservationId: null,
          updatedAt: new Date().toISOString(),
        });
        transaction.update(newTableRef, {
          reserved: true,
          reservedBy: reservation.userId ?? null,
          reservationId,
          updatedAt: new Date().toISOString(),
        });
        const updateData = {
          tableId: newTableId,
          tableNumber: newTable.number ?? reservation.tableNumber,
          previousTableId: currentTableId,
          previousTableNumber: oldTable.number ?? reservation.tableNumber,
          tableChangedAt: new Date().toISOString(),
          tableChangeAmount: 0,
          updatedAt: new Date().toISOString(),
        };
        transaction.update(reservationRef, updateData);
        if (reservation.userId) {
          const userResRef = adminFirestore
            .collection('users')
            .doc(reservation.userId)
            .collection('reservations')
            .doc(reservationId);
          transaction.update(userResRef, updateData);
        }
      });
      const updated = (await reservationRef.get()).data();
      return NextResponse.json({
        success: true,
        message: 'Table changed by admin (no charge or refund)',
        reservation: { id: reservationId, ...updated },
      });
    }

    // If customer already paid for the upgrade, complete the table swap
    if (paymentIntentId) {
      let paymentIntent: Stripe.PaymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch {
        return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
      }
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          { error: 'Payment not completed', status: paymentIntent.status },
          { status: 400 }
        );
      }
      if (paymentIntent.metadata?.reservationId !== reservationId || paymentIntent.metadata?.newTableId !== newTableId) {
        return NextResponse.json({ error: 'Payment does not match this reservation or table' }, { status: 400 });
      }

      // Run transaction: release old table, reserve new table, update reservation
      await adminFirestore.runTransaction(async (transaction) => {
        const newTableSnap = await transaction.get(newTableRef);
        const newTableData = newTableSnap.data();
        if (!newTableSnap.exists || newTableData?.reserved) {
          throw new Error('NEW_TABLE_NO_LONGER_AVAILABLE');
        }

        transaction.update(oldTableRef, {
          reserved: false,
          reservedBy: null,
          reservationId: null,
          updatedAt: new Date().toISOString(),
        });
        transaction.update(newTableRef, {
          reserved: true,
          reservedBy: reservation.userId ?? null,
          reservationId,
          updatedAt: new Date().toISOString(),
        });

        const previousTotal = Number(reservation.totalAmount ?? 0);
        const tableDiff = newPrice - oldPrice;
        const tableDiffWithFee = Math.round((tableDiff * (1 + SERVICE_FEE_RATE)) * 100) / 100;
        const newTotal = Math.round((previousTotal + tableDiffWithFee) * 100) / 100;

        transaction.update(reservationRef, {
          tableId: newTableId,
          tableNumber: newTable.number ?? newTableData?.number,
          totalAmount: newTotal,
          previousTableId: currentTableId,
          previousTableNumber: oldTable.number ?? reservation.tableNumber,
          tableChangedAt: new Date().toISOString(),
          tableChangeInvoiceId: paymentIntentId,
          tableChangeAmount: tableDiffWithFee,
          updatedAt: new Date().toISOString(),
        });

        const userReservationRef = adminFirestore
          .collection('users')
          .doc(reservation.userId)
          .collection('reservations')
          .doc(reservationId);
        transaction.update(userReservationRef, {
          tableId: newTableId,
          tableNumber: newTable.number ?? newTableData?.number,
          totalAmount: newTotal,
          previousTableId: currentTableId,
          previousTableNumber: oldTable.number ?? reservation.tableNumber,
          tableChangedAt: new Date().toISOString(),
          tableChangeInvoiceId: paymentIntentId,
          tableChangeAmount: tableDiffWithFee,
          updatedAt: new Date().toISOString(),
        });
      });

      const updated = (await reservationRef.get()).data();
      return NextResponse.json({
        success: true,
        message: 'Table changed successfully',
        reservation: { id: reservationId, ...updated },
      });
    }

    // New table must be available (not reserved by someone else)
    if (newTable.reserved) {
      return NextResponse.json({ error: 'That table is no longer available' }, { status: 409 });
    }

    const tablePriceDiff = newPrice - oldPrice;
    const tableDiffWithFee = Math.round((tablePriceDiff * (1 + SERVICE_FEE_RATE)) * 100) / 100;

    // Downgrade or same price: release old, reserve new, refund if downgrade
    if (tableDiffWithFee <= 0) {
      const refundAmount = Math.abs(tableDiffWithFee);
      const refundAmountCents = Math.round(refundAmount * 100);
      const originalPaymentId = reservation.paymentId as string;

      await adminFirestore.runTransaction(async (transaction) => {
        const newTableSnap = await transaction.get(newTableRef);
        if (!newTableSnap.exists || newTableSnap.data()?.reserved) {
          throw new Error('NEW_TABLE_NO_LONGER_AVAILABLE');
        }

        transaction.update(oldTableRef, {
          reserved: false,
          reservedBy: null,
          reservationId: null,
          updatedAt: new Date().toISOString(),
        });
        transaction.update(newTableRef, {
          reserved: true,
          reservedBy: reservation.userId ?? null,
          reservationId,
          updatedAt: new Date().toISOString(),
        });

        const previousTotal = Number(reservation.totalAmount ?? 0);
        const newTotal = Math.round((previousTotal - refundAmount) * 100) / 100;

        const updateData: Record<string, unknown> = {
          tableId: newTableId,
          tableNumber: newTable.number,
          totalAmount: newTotal,
          previousTableId: currentTableId,
          previousTableNumber: oldTable.number ?? reservation.tableNumber,
          tableChangedAt: new Date().toISOString(),
          tableChangeAmount: -refundAmount,
          updatedAt: new Date().toISOString(),
        };

        transaction.update(reservationRef, updateData);

        const userReservationRef = adminFirestore
          .collection('users')
          .doc(reservation.userId)
          .collection('reservations')
          .doc(reservationId);
        transaction.update(userReservationRef, updateData);
      });

      let refundId: string | null = null;
      if (refundAmountCents > 0 && originalPaymentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: originalPaymentId,
            amount: refundAmountCents,
            reason: 'requested_by_customer',
            metadata: {
              reservationId,
              reason: 'Table change (downgrade)',
              newTableId,
              previousTableId: currentTableId,
            },
          });
          refundId = refund.id;
          await reservationRef.update({
            tableChangeRefundId: refund.id,
            updatedAt: new Date().toISOString(),
          });
          await adminFirestore.collection('refunds').doc(refund.id).set({
            id: refund.id,
            paymentIntentId: originalPaymentId,
            reservationId,
            amount: refundAmount,
            amountCents: refundAmountCents,
            status: refund.status,
            reason: 'Table change (downgrade)',
            createdAt: new Date().toISOString(),
          });
        } catch (refundErr: unknown) {
          console.error('Stripe refund error on table downgrade:', refundErr);
          return NextResponse.json(
            { error: 'Table was changed but refund failed. Please contact support.', refundFailed: true },
            { status: 500 }
          );
        }
      }

      const updated = (await reservationRef.get()).data();
      return NextResponse.json({
        success: true,
        message: refundAmount > 0
          ? 'Table changed. A refund for the price difference will be processed shortly.'
          : 'Table changed successfully.',
        reservation: { id: reservationId, ...updated },
        refund: refundId ? { id: refundId, amount: refundAmount } : null,
      });
    }

    // Upgrade: create PaymentIntent for the difference; customer pays then POSTs again with paymentIntentId
    const amountCents = Math.round(tableDiffWithFee * 100);
    if (amountCents <= 0) {
      return NextResponse.json({ success: true, message: 'Table changed successfully.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        reservationId,
        newTableId,
        previousTableId: currentTableId,
        type: 'table_change',
        amountDue: String(tableDiffWithFee),
      },
    });

    return NextResponse.json({
      needsPayment: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountDue: tableDiffWithFee,
      newTableId,
      newTableNumber: newTable.number,
      currentTableNumber: oldTable.number ?? reservation.tableNumber,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NEW_TABLE_NO_LONGER_AVAILABLE') {
      return NextResponse.json(
        { error: 'That table is no longer available. Please choose another.' },
        { status: 409 }
      );
    }
    console.error(`Error changing table for reservation ${params.reservationId}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to change table' },
      { status: 500 }
    );
  }
}
