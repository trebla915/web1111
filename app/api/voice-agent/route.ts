import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual, createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HOLD_MS = 30 * 60 * 1000;
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

function authorized(request: NextRequest): boolean {
  const expected = process.env.VOICE_AGENT_SHARED_SECRET;
  const actual = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!expected || !actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function e164(value: unknown): string {
  if (typeof value !== 'string' || !PHONE_RE.test(value)) {
    throw new Error('Use a phone number in international format, such as +19152463945.');
  }
  return value;
}

function secretHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function twilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Phone messaging is not configured.');
  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

async function startVerification(phone: string): Promise<void> {
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!service) throw new Error('Reservation verification is not configured.');
  const headers = { Authorization: twilioAuth(), 'Content-Type': 'application/x-www-form-urlencoded' };
  const limitRef = adminFirestore.collection('voiceAgentRateLimits').doc(`otp_${secretHash(phone)}`);
  const now = Date.now();
  const canSend = await adminFirestore.runTransaction(async (tx) => {
    const snap = await tx.get(limitRef);
    const old = snap.data();
    const windowStart = Number(old?.windowStart ?? 0);
    const count = windowStart > now - 10 * 60 * 1000 ? Number(old?.count ?? 0) : 0;
    if (count >= 3) return false;
    tx.set(limitRef, { windowStart: count ? windowStart : now, count: count + 1, updatedAt: new Date().toISOString() });
    return true;
  });
  if (!canSend) throw new Error('Too many verification texts. Please try again in a few minutes.');

  const response = await fetch(`https://verify.twilio.com/v2/Services/${service}/Verifications`, {
    method: 'POST', headers, body: new URLSearchParams({ To: phone, Channel: 'sms' }),
  });
  if (!response.ok) throw new Error('Could not send a verification text. Please try again or call the venue.');
}

async function checkVerification(phone: string, code: string): Promise<boolean> {
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!service) throw new Error('Reservation verification is not configured.');
  const response = await fetch(`https://verify.twilio.com/v2/Services/${service}/VerificationCheck`, {
    method: 'POST',
    headers: { Authorization: twilioAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, Code: code }),
  });
  if (!response.ok) return false;
  const result = await response.json() as { status?: string };
  return result.status === 'approved';
}

async function sendText(phone: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !from) throw new Error('Text messaging is not configured.');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: twilioAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, From: from, Body: message }),
  });
  if (!response.ok) throw new Error('Could not send the payment link by text. Please call the venue.');
}

async function expireStaleHold(eventId: string, tableId: string): Promise<void> {
  const tableRef = adminFirestore.collection('events').doc(eventId).collection('tables').doc(tableId);
  const snap = await tableRef.get();
  const hold = snap.data()?.phoneReservationHold as { id?: string; expiresAt?: number; checkoutSessionId?: string } | undefined;
  if (!snap.exists || !hold?.id || !hold.expiresAt || hold.expiresAt > Date.now()) return;

  if (hold.checkoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(hold.checkoutSessionId);
    if (session.payment_status === 'paid') return;
    if (session.status === 'open') await stripe.checkout.sessions.expire(session.id);
  }

  await adminFirestore.runTransaction(async (tx) => {
    const current = await tx.get(tableRef);
    const currentHold = current.data()?.phoneReservationHold as { id?: string } | undefined;
    if (current.exists && currentHold?.id === hold.id) {
      tx.update(tableRef, {
        reserved: false,
        reservationId: FieldValue.delete(),
        phoneReservationHold: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

async function getQuote(input: {
  eventId: string;
  tableId: string;
  guestCount: number;
  bottleIds: string[];
}) {
  if (!input.eventId || !input.tableId || !Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 30 || input.bottleIds.length > 10) {
    throw new Error('Reservation details are incomplete.');
  }
  const eventRef = adminFirestore.collection('events').doc(input.eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists || eventSnap.data()?.reservationsEnabled !== true) throw new Error('Reservations are not available for that event.');
  const tableRef = eventRef.collection('tables').doc(input.tableId);
  await expireStaleHold(input.eventId, input.tableId);
  const tableSnap = await tableRef.get();
  if (!tableSnap.exists || tableSnap.data()?.reserved === true) throw new Error('That table is not currently available.');
  const table = tableSnap.data()!;
  if (input.guestCount > Number(table.capacity ?? 0)) throw new Error('The group is larger than that table seats.');

  const bottlesSnap = await eventRef.collection('bottles').get();
  const bottlesById = new Map(bottlesSnap.docs.map((doc) => [doc.id, doc.data()]));
  const selected = input.bottleIds.map((id) => {
    const item = bottlesById.get(id);
    if (!item) throw new Error('One or more bottle selections are no longer available.');
    return { id, name: String(item.name ?? ''), price: Number(item.price ?? 0) };
  });
  const minimumBottles = Number(table.minimumBottles ?? 0);
  if (selected.length < minimumBottles) throw new Error(`This table requires at least ${minimumBottles} bottles.`);

  const tablePrice = Number(table.price ?? 0);
  const bottlesCost = selected.reduce((sum, item) => sum + item.price, 0);
  const taxableSubtotal = tablePrice + bottlesCost;
  const tax = taxableSubtotal * 0.0825;
  const gratuity = bottlesCost * 0.18;
  const beforeCardFee = taxableSubtotal + tax + gratuity;
  const total = Math.round((beforeCardFee + beforeCardFee * 0.029 + 0.30) * 100) / 100;
  if (!Number.isFinite(total) || total <= 0) throw new Error('Could not calculate a valid total.');
  const event = eventSnap.data()!;
  return { eventRef, eventSnap, event, tableRef, table, selected, tablePrice, bottlesCost, tax, gratuity, total, ...input };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;
    // Checkout status is the only public action. The random Stripe session ID
    // is required and the response contains only payment/processing state.
    if (!authorized(request) && action !== 'checkout-status') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'events') {
      const snapshot = await adminFirestore.collection('events').get();
      const today = new Date().toISOString().slice(0, 10);
      const events = snapshot.docs.flatMap((doc) => {
        const event = doc.data();
        const date = String(event.date ?? '');
        if ((event.status && event.status !== 'active') || event.reservationsEnabled !== true || (date && date.slice(0, 10) < today)) return [];
        return [{ id: doc.id, title: String(event.title ?? 'Event'), date, description: String(event.description ?? '') }];
      }).sort((a, b) => a.date.localeCompare(b.date));
      return NextResponse.json({ events });
    }

    if (action === 'availability' || action === 'bottles') {
      const eventId = typeof body.eventId === 'string' ? body.eventId : '';
      if (!eventId) return NextResponse.json({ error: 'Event is required.' }, { status: 400 });
      const eventRef = adminFirestore.collection('events').doc(eventId);
      const eventSnap = await eventRef.get();
      if (!eventSnap.exists || eventSnap.data()?.reservationsEnabled !== true) {
        return NextResponse.json({ error: 'Reservations are not available for that event.' }, { status: 404 });
      }

      if (action === 'availability') {
        const tablesSnap = await eventRef.collection('tables').get();
        await Promise.all(tablesSnap.docs.map((doc) => expireStaleHold(eventId, doc.id)));
        const fresh = await eventRef.collection('tables').get();
        const tables = fresh.docs.map((doc) => {
          const table = doc.data();
          return {
            id: doc.id,
            number: Number(table.number ?? 0),
            capacity: Number(table.capacity ?? 0),
            price: Number(table.price ?? 0),
            minimumBottles: Number(table.minimumBottles ?? 0),
            available: table.reserved !== true,
            location: String(table.location ?? ''),
          };
        });
        return NextResponse.json({ event: { id: eventId, title: eventSnap.data()?.title, date: eventSnap.data()?.date }, tables });
      }

      const bottlesSnap = await eventRef.collection('bottles').get();
      const bottles = bottlesSnap.docs.map((doc) => {
        const item = doc.data();
        return { id: doc.id, name: String(item.name ?? ''), price: Number(item.price ?? 0), description: String(item.description ?? '') };
      });
      return NextResponse.json({ bottles });
    }

    if (action === 'send-lookup-code') {
      const phone = e164(body.phone);
      await startVerification(phone);
      return NextResponse.json({ sent: true });
    }

    if (action === 'quote') {
      const eventId = typeof body.eventId === 'string' ? body.eventId : '';
      const tableId = typeof body.tableId === 'string' ? body.tableId : '';
      const guestCount = Number(body.guestCount);
      const bottleIds = Array.isArray(body.bottleIds) ? body.bottleIds.filter((id): id is string => typeof id === 'string') : [];
      const quote = await getQuote({ eventId, tableId, guestCount, bottleIds });
      return NextResponse.json({
        event: { id: eventId, title: quote.event.title, date: quote.event.date },
        table: { id: tableId, number: quote.table.number, capacity: quote.table.capacity, minimumBottles: quote.table.minimumBottles },
        guestCount,
        bottles: quote.selected,
        tablePrice: quote.tablePrice,
        bottlesCost: quote.bottlesCost,
        salesTax: quote.tax,
        gratuity: quote.gratuity,
        total: quote.total,
      });
    }

    if (action === 'verify-lookup-code') {
      const phone = e164(body.phone);
      const code = typeof body.code === 'string' ? body.code.trim() : '';
      if (!/^\d{4,10}$/.test(code)) return NextResponse.json({ verified: false });
      const verified = await checkVerification(phone, code);
      if (!verified) return NextResponse.json({ verified: false });
      const snap = await adminFirestore.collection('reservations').where('userPhone', '==', phone).limit(20).get();
      const reservations = snap.docs.map((doc) => {
        const item = doc.data();
        return {
          reference: doc.id,
          eventName: String(item.eventName ?? 'Event'),
          eventDate: String(item.eventDate ?? ''),
          tableNumber: Number(item.tableNumber ?? 0),
          status: String(item.status ?? 'pending'),
          totalAmount: Number(item.totalAmount ?? 0),
        };
      }).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
      return NextResponse.json({ verified: true, reservations });
    }

    if (action === 'create-checkout') {
      if (body.smsConsent !== true) return NextResponse.json({ error: 'The caller must agree to receive a text.' }, { status: 400 });
      if (body.callerConfirmed !== true) return NextResponse.json({ error: 'The caller must confirm the quoted booking before a payment link is sent.' }, { status: 400 });
      const phone = e164(body.phone);
      const eventId = typeof body.eventId === 'string' ? body.eventId : '';
      const tableId = typeof body.tableId === 'string' ? body.tableId : '';
      const guestCount = Number(body.guestCount);
      const callerName = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
      const bottleIds = Array.isArray(body.bottleIds) ? body.bottleIds.filter((id): id is string => typeof id === 'string') : [];
      if (!eventId || !tableId || !callerName || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 30) {
        return NextResponse.json({ error: 'Reservation details are incomplete.' }, { status: 400 });
      }

      const quote = await getQuote({ eventId, tableId, guestCount, bottleIds });
      const { event, tableRef, table, selected, tablePrice, bottlesCost, tax, gratuity, total } = quote;
      const quotedTotal = Number(body.quotedTotal);
      if (!Number.isFinite(quotedTotal) || Math.abs(quotedTotal - total) > 0.01) {
        return NextResponse.json({ error: 'The live price changed. Read the updated quote and ask for confirmation again.', quote: { total, tablePrice, bottlesCost, salesTax: tax, gratuity } }, { status: 409 });
      }

      await expireStaleHold(eventId, tableId);
      const holdId = crypto.randomUUID();
      const expiresAt = Date.now() + HOLD_MS;
      const hold = {
        id: holdId,
        expiresAt,
        checkoutSessionId: '',
        source: 'phone',
      };
      const claimed = await adminFirestore.runTransaction(async (tx) => {
        const current = await tx.get(tableRef);
        const currentTable = current.data();
        if (
          !current.exists ||
          currentTable?.reserved === true ||
          Number(currentTable?.price ?? 0) !== tablePrice ||
          Number(currentTable?.capacity ?? 0) !== Number(table.capacity ?? 0) ||
          Number(currentTable?.minimumBottles ?? 0) !== Number(table.minimumBottles ?? 0)
        ) return false;
        tx.update(tableRef, { reserved: true, phoneReservationHold: hold, updatedAt: new Date().toISOString() });
        return true;
      });
      if (!claimed) return NextResponse.json({ error: 'That table was just reserved. Please choose another table.' }, { status: 409 });

      const reservationTime = new Date().toISOString();
      const guestUserId = `phone_${secretHash(phone).slice(0, 32)}`;
      const metadata: Record<string, string> = {
        userId: guestUserId,
        eventId,
        eventName: String(event.title ?? 'Event').slice(0, 100),
        eventDate: String(event.date ?? '').slice(0, 100),
        tableId,
        tableNumber: String(table.number ?? ''),
        tablePrice: String(tablePrice),
        guests: String(guestCount),
        name: callerName,
        email: typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '',
        phone,
        reservationTime,
        bottleCount: String(selected.length),
        bottlesOrdered: selected.map((item) => `${item.name} ($${item.price})`).join(', ') || 'None',
        bottlesCost: String(bottlesCost),
        mixerCount: '0',
        mixersOrdered: 'None',
        mixersCost: '0',
        subtotal: String(taxableSubtotal),
        totalAmount: String(total),
        platform: 'web',
        source: '1111_phone',
        phoneHoldId: holdId,
      };

      let checkout;
      try {
        if (metadata.bottlesOrdered.length > 450) throw new Error('The selected bottle descriptions are too long for a secure checkout. Please choose fewer bottles or call the venue.');
        checkout = await stripe.checkout.sessions.create({
          mode: 'payment',
          expires_at: Math.ceil(expiresAt / 1000),
          payment_method_types: ['card'],
          line_items: [{
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(total * 100),
              product_data: { name: `11:11 EPTX table ${table.number} — ${event.title}`, description: `${guestCount} guests; ${selected.length} bottle(s); includes listed taxes and gratuity` },
            },
          }],
          metadata: { eventId, tableId, phoneHoldId: holdId },
          payment_intent_data: { metadata },
          success_url: `https://www.1111eptx.com/reserve/${encodeURIComponent(eventId)}/confirmation?checkout_session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `https://www.1111eptx.com/reserve/${encodeURIComponent(eventId)}`,
        });
        await tableRef.update({ 'phoneReservationHold.checkoutSessionId': checkout.id });
        await sendText(phone, `11:11 EPTX reservation: ${String(event.title)} — table ${table.number}, ${formatMoney(total)}. Complete payment within 30 minutes to confirm: ${checkout.url}`);
      } catch (error) {
        if (checkout?.id) await stripe.checkout.sessions.expire(checkout.id).catch(() => undefined);
        await adminFirestore.runTransaction(async (tx) => {
          const current = await tx.get(tableRef);
          const currentHold = current.data()?.phoneReservationHold as { id?: string } | undefined;
          if (currentHold?.id === holdId) tx.update(tableRef, { reserved: false, phoneReservationHold: FieldValue.delete(), updatedAt: new Date().toISOString() });
        });
        throw error;
      }

      return NextResponse.json({
        sent: true,
        checkoutUrl: checkout.url,
        expiresAt: new Date(expiresAt).toISOString(),
        quote: { eventName: event.title, eventDate: event.date, tableNumber: table.number, guestCount, bottles: selected, tablePrice, bottlesCost, tax, gratuity, total },
      });
    }

    if (action === 'checkout-status') {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
      if (!sessionId.startsWith('cs_') || sessionId.length < 32 || sessionId.length > 255) {
        return NextResponse.json({ error: 'Invalid checkout session.' }, { status: 400 });
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.source !== '1111_phone') return NextResponse.json({ error: 'Checkout session not found.' }, { status: 404 });
      if (session.payment_status !== 'paid' || !session.payment_intent) return NextResponse.json({ paid: false });
      const paymentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
      const payment = await adminFirestore.collection('payments').doc(paymentId).get();
      const reservationId = payment.data()?.reservationId as string | undefined;
      if (!reservationId || payment.data()?.reservationCreated !== true) {
        return NextResponse.json({ paid: true, processed: false, reservationId: null });
      }
      const reservationSnap = await adminFirestore.collection('reservations').doc(reservationId).get();
      if (!reservationSnap.exists) return NextResponse.json({ paid: true, processed: false, reservationId: null });
      const reservation = reservationSnap.data()!;
      return NextResponse.json({
        paid: true,
        processed: true,
        reservation: {
          id: reservationId,
          eventId: reservation.eventId,
          eventName: reservation.eventName,
          eventDate: reservation.eventDate,
          tableNumber: reservation.tableNumber,
          guestCount: reservation.guestCount,
          status: reservation.status,
          totalAmount: reservation.totalAmount,
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : '';
    const safeMessage = /^(Use a phone number|Phone messaging is not configured|Reservation verification is not configured|Too many verification texts|Could not send a verification text|Could not send the payment link by text|Text messaging is not configured|Reservations are not available|That table is not currently available|The group is larger than that table seats|One or more bottle selections are no longer available|This table requires at least|Reservation details are incomplete|The caller must agree to receive a text|The caller must confirm the quoted booking|Could not calculate a valid total|The selected table was no longer available)/i.test(rawMessage);
    const message = safeMessage ? rawMessage : 'The reservation service is temporarily unavailable. Please call the venue.';
    const status = /Reservations are not available/i.test(message) ? 404
      : /That table is not currently available|The selected table was no longer available/i.test(message) ? 409
      : /Use a phone number|Too many|larger than|requires at least|no longer available|details are incomplete|must agree|must confirm/i.test(message) ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
