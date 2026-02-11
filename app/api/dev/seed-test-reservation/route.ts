import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.1111eptx.com';

/**
 * POST /api/dev/seed-test-reservation
 *
 * Creates a test event, one table, and one confirmed reservation in Firestore
 * so you can test the full flow: confirmation page → QR code → staff check-in.
 *
 * Body (optional): { customerName?, customerEmail? }
 * Returns: { eventId, tableId, reservationId, confirmationUrl, checkInUrl, staffScannerUrl }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customerName = body.customerName || 'Test Customer';
    const customerEmail = body.customerEmail || 'test@example.com';

    const now = new Date().toISOString();
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7);
    const eventDateStr = eventDate.toISOString();

    // 1. Create test event in Firestore
    const eventRef = adminFirestore.collection('events').doc();
    await eventRef.set({
      title: 'Test Event — QR Check-in',
      date: eventDateStr,
      description: 'Use this event to test reservation and check-in flow.',
      createdAt: now,
      updatedAt: now,
    });
    const eventId = eventRef.id;

    // 2. Create one table for this event
    const tableRef = eventRef.collection('tables').doc();
    const tableNumber = 99;
    await tableRef.set({
      number: tableNumber,
      capacity: 6,
      price: 250,
      reserved: false,
      location: 'center',
      minimumBottles: 1,
      createdAt: now,
    });
    const tableId = tableRef.id;

    // 3. Create reservation
    const reservationRef = adminFirestore.collection('reservations').doc();
    const reservationId = reservationRef.id;

    await reservationRef.set({
      userId: 'test-user-id',
      eventId,
      eventName: 'Test Event — QR Check-in',
      tableId,
      tableNumber,
      guestCount: 4,
      bottles: [{ id: 'b1', name: 'Test Bottle' }],
      totalAmount: 250,
      paymentId: `test_${reservationId}`,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
      userName: customerName,
      userEmail: customerEmail,
      userPhone: '+1 555 000 0000',
    });

    // 4. Mark table as reserved
    await tableRef.update({
      reserved: true,
      reservationId,
      updatedAt: now,
    });

    const confirmationUrl = `${APP_URL}/reserve/${eventId}/confirmation?paymentId=test_${reservationId}&status=test`;
    const checkInUrl = `${APP_URL}/staff/check-in/${reservationId}`;
    const staffScannerUrl = `${APP_URL}/staff/scanner`;

    return NextResponse.json({
      eventId,
      tableId,
      reservationId,
      confirmationUrl,
      checkInUrl,
      staffScannerUrl,
      message:
        'Test reservation created. Open confirmationUrl to see the QR code, then scan it or open checkInUrl to test check-in.',
    });
  } catch (error: any) {
    console.error('Seed test reservation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed test reservation' },
      { status: 500 }
    );
  }
}
