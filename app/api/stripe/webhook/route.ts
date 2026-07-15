import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

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

  // Idempotency: skip if we already processed this payment
  const existing = await paymentDocRef.get();
  if (existing.exists && existing.data()?.reservationCreated) {
    return;
  }

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
  };

  const batch = adminFirestore.batch();

  batch.set(reservationRef, reservationData);

  // Mirror under user subcollection so /dashboard/reservations works
  const userResRef = adminFirestore
    .collection('users')
    .doc(userId)
    .collection('reservations')
    .doc(reservationId);
  batch.set(userResRef, reservationData);

  // Mark the table reserved so it can't be double-booked
  const tableRef = adminFirestore
    .collection('events')
    .doc(eventId)
    .collection('tables')
    .doc(tableId);
  batch.update(tableRef, { reserved: true, reservationId, updatedAt: now });

  // Write payment tracking doc — this is what the poller is waiting for
  batch.set(paymentDocRef, {
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
    reservationCreated: true,
    reservationId,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
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
