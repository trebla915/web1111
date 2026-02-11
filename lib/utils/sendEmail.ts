import { Resend } from 'resend';
import QRCode from 'qrcode';
import { adminStorage } from '@/lib/firebase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'reservations@1111eptx.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.1111eptx.com';

export function getChangeTableUrl(reservationId: string): string {
  return `${APP_URL}/reservation/${reservationId}/change-table`;
}

interface ReservationEmailData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  eventName: string;
  eventDate: string;
  tableNumber: number;
  guestCount: number;
  totalAmount?: number;
  bottles?: Array<{ name: string }>;
}

/**
 * Generate QR code as PNG buffer
 */
async function generateQRCodeBuffer(reservationId: string): Promise<Buffer> {
  const checkInUrl = `${APP_URL}/staff/check-in/${reservationId}`;
  return QRCode.toBuffer(checkInUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    type: 'png',
  });
}

/**
 * Upload QR to Firebase Storage and return public URL.
 * Hosted URLs display in Gmail/Outlook; data URIs are often blocked.
 */
async function uploadQRCodeAndGetUrl(reservationId: string): Promise<string> {
  const buffer = await generateQRCodeBuffer(reservationId);
  const path = `reservation-qr/${reservationId}.png`;
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: { contentType: 'image/png' },
  });
  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

/**
 * Format a date string for display in emails
 */
function formatEmailDate(dateInput: string): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return dateInput;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateInput;
  }
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Send reservation confirmation email with QR code
 */
export async function sendReservationConfirmation(
  data: ReservationEmailData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    // Host QR image on Firebase Storage; use public URL in email (Gmail/Outlook block data URIs)
    const qrImageUrl = await uploadQRCodeAndGetUrl(data.reservationId);

    const bottlesList = data.bottles && data.bottles.length > 0
      ? data.bottles.map((b) => b.name).join(', ')
      : null;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border-radius:12px;overflow:hidden;border:1px solid #222222;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#000000;padding:30px 40px;text-align:center;border-bottom:1px solid #222222;">
              <h1 style="margin:0;font-size:28px;color:#ffffff;letter-spacing:4px;font-weight:700;">11:11</h1>
              <p style="margin:8px 0 0;font-size:12px;color:#888888;letter-spacing:2px;text-transform:uppercase;">El Paso, Texas</p>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="padding:30px 40px;text-align:center;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#22d3ee;font-weight:700;">Reservation Confirmed</h2>
              <p style="margin:0;font-size:14px;color:#999999;">Your table is reserved and ready for you</p>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:0 40px 25px;text-align:center;">
              <div style="background-color:#ffffff;display:inline-block;padding:16px;border-radius:12px;">
                <img src="${qrImageUrl}" alt="Check-in QR Code" width="200" height="200" style="display:block;width:200px;height:200px;" />
              </div>
              <p style="margin:12px 0 0;font-size:12px;color:#888888;">Show this QR code to staff when you arrive</p>
            </td>
          </tr>

          <!-- Reservation Details -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:8px;border:1px solid #2a2a2a;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Event</span><br/>
                          <span style="font-size:16px;color:#ffffff;font-weight:600;">${data.eventName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Date</span><br/>
                          <span style="font-size:15px;color:#ffffff;">${formatEmailDate(data.eventDate)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%">
                                <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Table</span><br/>
                                <span style="font-size:20px;color:#22d3ee;font-weight:700;">#${data.tableNumber}</span>
                              </td>
                              <td width="50%">
                                <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Guests</span><br/>
                                <span style="font-size:20px;color:#ffffff;font-weight:700;">${data.guestCount}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Guest Name</span><br/>
                          <span style="font-size:15px;color:#ffffff;">${data.customerName}</span>
                        </td>
                      </tr>
                      ${bottlesList ? `
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Bottles</span><br/>
                          <span style="font-size:15px;color:#ffffff;">${bottlesList}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.totalAmount ? `
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Total Paid</span><br/>
                          <span style="font-size:18px;color:#22d3ee;font-weight:700;">${formatCurrency(data.totalAmount)}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Change table -->
          <tr>
            <td style="padding:0 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:8px;border:1px solid #2a2a2a;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0 0 12px;font-size:14px;color:#bbbbbb;">Need a different table?</p>
                    <a href="${getChangeTableUrl(data.reservationId)}" style="display:inline-block;padding:12px 24px;background-color:#0891b2;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Change table</a>
                    <p style="margin:12px 0 0;font-size:12px;color:#888888;">You can switch to another available table. Price differences may apply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Info -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:8px;border:1px solid #2a2a2a;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#22d3ee;font-weight:600;">Important</p>
                    <ul style="margin:0;padding:0 0 0 16px;color:#bbbbbb;font-size:13px;line-height:22px;">
                      <li>Save this email or screenshot the QR code</li>
                      <li>Present the QR code at the door for quick check-in</li>
                      <li>Arrive on time to secure your table</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #222222;">
              <p style="margin:0 0 4px;font-size:12px;color:#666666;">Reservation ID: ${data.reservationId}</p>
              <p style="margin:0;font-size:12px;color:#666666;">11:11 EPTX &bull; El Paso, Texas</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data: emailResult, error } = await resend.emails.send({
      from: `11:11 EPTX <${FROM_EMAIL}>`,
      to: [data.customerEmail],
      subject: `Reservation Confirmed — Table #${data.tableNumber} | ${data.eventName}`,
      html,
      tags: [
        { name: 'type', value: 'reservation_confirmation' },
        { name: 'reservation_id', value: data.reservationId },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`Confirmation email sent for reservation ${data.reservationId}: ${emailResult?.id}`);
    return { success: true, emailId: emailResult?.id };
  } catch (err: any) {
    console.error('Error sending confirmation email:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}
