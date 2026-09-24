import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { adminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    try {
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
    } catch (err) {
      console.error('Webhook: handlePaymentSucceeded failed:', err);
      // Return 500 so Stripe retries
      return NextResponse.json({ error: 'Internal error processing payment' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const piId = paymentIntent.id;
  const meta = paymentIntent.metadata;
  const now = new Date().toISOString();

  const paymentDocRef = adminFirestore.collection('payments').doc(piId);

  const eventId = meta.eventId;
  const tableId = meta.tableId;
  const userId = meta.userId;

  if (!eventId || !tableId || !userId) {
    console.error('Webhook: missing required metadata', { piId, eventId, tableId, userId });
    // Write a payment doc so the poller gets a 200 instead of 404, but marks it failed
    await paymentDocRef.set({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      reservationCreated: false,
      error: 'Missing required metadata fields',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    return;
  }

  const bottles = parseItemsString(meta.bottlesOrdered);
  const mixers = parseItemsString(meta.mixersOrdered);
  const totalAmount = parseFloat(meta.totalAmount) || paymentIntent.amount / 100;
  const tableNumber = parseInt(meta.tableNumber, 10) || 0;
  const guestCount = parseInt(meta.guests, 10) || 1;

  const reservationRef = adminFirestore.collection('reservations').doc();
  const reservationId = reservationRef.id;

  const reservationData = {
    userId,
    eventId,
    eventName: meta.eventName || '',
    tableId,
    tableNumber,
    guestCount,
    bottles,
    mixers,
    totalAmount,
    paymentId: piId,
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
    userName: meta.name || '',
    userEmail: meta.email || '',
    userPhone: meta.phone || '',
    eventDate: meta.eventDate || '',
  };
  const userResRef = adminFirestore
    .collection('users')
    .doc(userId)
    .collection('reservations')
    .doc(reservationId);
  const tableRef = adminFirestore
    .collection('events')
    .doc(eventId)
    .collection('tables')
    .doc(tableId);

  const phoneHoldId = meta.phoneHoldId;
  const claim = await adminFirestore.runTransaction(async (tx) => {
    const [paymentSnap, tableSnap] = await Promise.all([tx.get(paymentDocRef), tx.get(tableRef)]);
    if (paymentSnap.exists && paymentSnap.data()?.reservationCreated === true) {
      return { created: true, duplicate: true };
    }

    const table = tableSnap.data();
    const hold = table?.phoneReservationHold as { id?: string } | undefined;
    const ownsHold = Boolean(phoneHoldId && hold?.id === phoneHoldId);
    const unavailable = !tableSnap.exists || (table?.reserved === true && !ownsHold) || (Boolean(phoneHoldId) && !ownsHold);
    if (unavailable) {
      tx.set(paymentDocRef, {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        reservationCreated: false,
        error: 'The selected table was no longer available when payment completed.',
        userId,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      return { created: false, duplicate: false };
    }

    tx.set(reservationRef, reservationData);
    tx.set(userResRef, reservationData);
    tx.update(tableRef, {
      reserved: true,
      reservationId,
      phoneReservationHold: FieldValue.delete(),
      updatedAt: now,
    });
    tx.set(paymentDocRef, {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      reservationCreated: true,
      reservationId,
      userId,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    return { created: true, duplicate: false };
  });

  if (!claim.created) {
    // Payment has already succeeded. Refund automatically rather than leave a
    // paid caller without a reservation if another channel won the table race.
    const refund = await stripe.refunds.create(
      { payment_intent: piId, reason: 'duplicate' },
      { idempotencyKey: `reservation-table-conflict-${piId}` },
    );
    await paymentDocRef.set({ refunded: true, refundId: refund.id, updatedAt: new Date().toISOString() }, { merge: true });
    console.error('Webhook: payment refunded because table was already claimed', { piId, eventId, tableId });
    return;
  }

  if (claim.duplicate) return;
  console.log(`Webhook: reservation ${reservationId} created for payment ${piId}`);
}

// Parse "Name ($price), Name2 ($price2)" → [{name, price}]
function parseItemsString(str: string | undefined): { name: string; price: number }[] {
  if (!str || str === 'None') return [];
  return str.split(', ').flatMap(item => {
    const match = item.match(/^(.+?) \(\$(\d+(?:\.\d+)?)\)$/);
    if (match) return [{ name: match[1], price: parseFloat(match[2]) }];
    if (item.trim()) return [{ name: item.trim(), price: 0 }];
    return [];
  });
}
