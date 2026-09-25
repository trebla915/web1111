/**
 * Outbound SMS through Twilio's REST API. Server-only: reads Twilio secrets.
 *
 * Shared by the phone-reservation API (payment links, lookup codes) and the
 * Stripe webhook (confirmation texts for phone bookings).
 */

export function twilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Phone messaging is not configured.');
  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

/** Sends one text. Throws `failureMessage` if Twilio rejects it. */
export async function sendText(
  phone: string,
  message: string,
  failureMessage = 'Could not send the text message. Please call the venue.',
): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !from) throw new Error('Text messaging is not configured.');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: twilioAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, From: from, Body: message }),
  });
  if (!response.ok) throw new Error(failureMessage);
}
