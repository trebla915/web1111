import { NextRequest, NextResponse } from 'next/server';
import { deliverReservationConfirmation } from '@/lib/reservations/confirmation';
import { ADMIN_ROLES, STAFF_ROLES, authErrorResponse } from '@/lib/auth/server';
import { loadAuthorizedReservation, NotFoundError } from '@/lib/auth/reservation';

export const dynamic = 'force-dynamic';

// POST /api/reservations/[reservationId]/send-confirmation
// Sends a confirmation email with QR code for the reservation
// Body: { forceResend?: boolean } - set true (e.g. from admin) to resend even if already sent
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  try {
    // Resending a confirmation emails the customer: owner or admin only.
    await loadAuthorizedReservation(request, params.reservationId, ADMIN_ROLES);
    const { reservationId } = params;
    const body = await request
      .json()
      .catch(() => ({})) as { forceResend?: boolean } | undefined;
    const forceResend = !!body?.forceResend;

    const result = await deliverReservationConfirmation(reservationId, { forceResend });

    if (result.status === 'not-found') {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (result.status === 'already-sent') {
      return NextResponse.json({
        success: true,
        message: 'Confirmation email was already sent',
        alreadySent: true,
      });
    }

    if (result.status === 'no-email') {
      return NextResponse.json(
        { error: 'No customer email on this reservation' },
        { status: 400 }
      );
    }

    if (result.status === 'failed') {
      console.error(
        `Failed to send confirmation email for ${reservationId}:`,
        result.error
      );
      return NextResponse.json(
        {
          error: 'Failed to send confirmation email',
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent',
      emailId: result.emailId,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const __authed = authErrorResponse(error);
    if (__authed) return __authed;
    const message = error?.message || String(error);
    console.error(
      `Error in send-confirmation for ${params.reservationId}:`,
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to send confirmation email',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
