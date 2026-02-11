import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { sendReservationConfirmation } from '@/lib/utils/sendEmail';

// POST /api/reservations/[reservationId]/send-confirmation
// Sends a confirmation email with QR code for the reservation
// Body: { forceResend?: boolean } - set true (e.g. from admin) to resend even if already sent
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    const { reservationId } = params;
    const body = await request.json().catch(() => ({}));
    const forceResend = !!body?.forceResend;

    // Get reservation from Firestore
    const reservationRef = adminFirestore
      .collection('reservations')
      .doc(reservationId);

    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const reservation = reservationDoc.data();

    // Idempotency: skip if confirmation email was already sent (unless forceResend)
    if (reservation?.confirmationEmailSent && !forceResend) {
      return NextResponse.json({
        success: true,
        message: 'Confirmation email was already sent',
        alreadySent: true,
      });
    }

    // Require a customer email
    const customerEmail = reservation?.userEmail;
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No customer email on this reservation' },
        { status: 400 }
      );
    }

    // Get event details for the email
    let eventName = reservation?.eventName || 'Event';
    let eventDate = '';

    if (reservation?.eventId) {
      try {
        const eventDoc = await adminFirestore
          .collection('events')
          .doc(reservation.eventId)
          .get();

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

    // Send the confirmation email
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

    if (!result.success) {
      console.error(
        `Failed to send confirmation email for ${reservationId}:`,
        result.error
      );
      return NextResponse.json(
        { error: 'Failed to send confirmation email', details: result.error },
        { status: 500 }
      );
    }

    // Mark as sent so we don't send again
    await reservationRef.update({
      confirmationEmailSent: true,
      confirmationEmailSentAt: new Date().toISOString(),
      confirmationEmailId: result.emailId || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent',
      emailId: result.emailId,
    });
  } catch (error: any) {
    console.error(
      `Error in send-confirmation for ${params.reservationId}:`,
      error
    );
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}
