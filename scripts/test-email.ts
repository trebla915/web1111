// Quick test script: npx tsx scripts/test-email.ts
// Sends a sample reservation confirmation email

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_XnFsrwyD_L6FCjLEGZjfPQXQLLEBFwD4P';
const TO_EMAIL = 'mcitymarketing@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // Resend test sender (works before domain verification)
const APP_URL = 'https://www.1111eptx.com';

async function main() {
  const reservationId = 'test_reservation_123';
  const checkInUrl = `${APP_URL}/staff/check-in/${reservationId}`;

  // Use a public QR API so the image loads in email (Gmail blocks data: URIs)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkInUrl)}`;
  console.log('Using hosted QR image URL for email');

  const resend = new Resend(RESEND_API_KEY);

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
                          <span style="font-size:16px;color:#ffffff;font-weight:600;">Friday Night Live</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Date</span><br/>
                          <span style="font-size:15px;color:#ffffff;">Saturday, February 15, 2026, 10:00 PM</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%">
                                <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Table</span><br/>
                                <span style="font-size:20px;color:#22d3ee;font-weight:700;">#7</span>
                              </td>
                              <td width="50%">
                                <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Guests</span><br/>
                                <span style="font-size:20px;color:#ffffff;font-weight:700;">6</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Guest Name</span><br/>
                          <span style="font-size:15px;color:#ffffff;">Albert Borrego</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Bottles</span><br/>
                          <span style="font-size:15px;color:#ffffff;">Don Julio 1942, Clase Azul Reposado</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Total Paid</span><br/>
                          <span style="font-size:18px;color:#22d3ee;font-weight:700;">$1,250.00</span>
                        </td>
                      </tr>
                    </table>
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
              <p style="margin:0 0 4px;font-size:12px;color:#666666;">Reservation ID: test_reservation_123</p>
              <p style="margin:0;font-size:12px;color:#666666;">11:11 EPTX &bull; El Paso, Texas</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  console.log(`Sending test email to ${TO_EMAIL}...`);

  const { data, error } = await resend.emails.send({
    from: `11:11 EPTX <${FROM_EMAIL}>`,
    to: [TO_EMAIL],
    subject: 'Reservation Confirmed — Table #7 | Friday Night Live',
    html,
    tags: [
      { name: 'type', value: 'test_confirmation' },
    ],
  });

  if (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }

  console.log('SUCCESS! Email ID:', data?.id);
  console.log('Check your inbox at tr3bla915@gmail.com');
}

main().catch(console.error);
