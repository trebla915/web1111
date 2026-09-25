import { adminFirestore } from '@/lib/firebase/admin';
import { sendReservationConfirmation } from '@/lib/utils/sendEmail';

/**
 * Emails the reservation confirmation (with its QR code) and records that it
 * was sent. Server-only; performs no authorization — callers must.
 *
 * Used by POST /api/reservations/[id]/send-confirmation (owner or admin) and
 * by the Stripe webhook for phone bookings, whose callers are never signed in
 * on the web and so could not trigger the email from the confirmation page.
 *
 * Idempotent: a reservation already marked `confirmationEmailSent` is skipped
 * unless `forceResend` is set.
 */
export type ConfirmationResult =
  | { status: 'sent'; emailId?: string | null }
  | { status: 'already-sent' }
  | { status: 'not-found' }
  | { status: 'no-email' }
  | { status: 'failed'; error: unknown };

export async function deliverReservationConfirmation(
  reservationId: string,
  { forceResend = false }: { forceResend?: boolean } = {},
): Promise<ConfirmationResult> {
  const reservationRef = adminFirestore.collection('reservations').doc(reservationId);
  const reservationDoc = await reservationRef.get();
  if (!reservationDoc.exists) return { status: 'not-found' };

  const reservation = reservationDoc.data();
  if (reservation?.confirmationEmailSent && !forceResend) return { status: 'already-sent' };

  const customerEmail = reservation?.userEmail;
  if (!customerEmail) return { status: 'no-email' };

  let eventName = reservation?.eventName || 'Event';
  let eventDate = '';
  if (reservation?.eventId) {
    try {
      const eventDoc = await adminFirestore.collection('events').doc(reservation.eventId).get();
      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        eventName = eventData?.title || eventName;
        eventDate = eventData?.date || reservation?.createdAt || '';
      }
    } catch (eventErr) {
      console.error('Error fetching event for email:', eventErr);
      // Continue with whatever info we have
    }
  }

  const result = await sendReservationConfirmation({
    reservationId,
    customerName: reservation?.userName || 'Guest',
    customerEmail,
    eventName,
    eventDate,
    tableNumber: reservation?.tableNumber || 0,
    guestCount: reservation?.guestCount || 1,
    totalAmount: reservation?.totalAmount,
    bottles: reservation?.bottles,
  });
  if (!result.success) return { status: 'failed', error: result.error };

  await reservationRef.update({
    confirmationEmailSent: true,
    confirmationEmailSentAt: new Date().toISOString(),
    confirmationEmailId: result.emailId || null,
  });
  return { status: 'sent', emailId: result.emailId };
}
