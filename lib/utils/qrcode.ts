import QRCode from 'qrcode';

export interface QRCodeData {
  reservationId: string;
  eventId: string;
  tableNumber: number;
  timestamp: number;
}

/**
 * Generate a QR code for a reservation
 * @param reservationId The reservation ID
 * @param eventId The event ID
 * @param tableNumber The table number
 * @returns QR code as base64 data URL
 */
export async function generateReservationQRCode(
  reservationId: string,
  eventId: string,
  tableNumber: number
): Promise<string> {
  try {
    const qrData: QRCodeData = {
      reservationId,
      eventId,
      tableNumber,
      timestamp: Date.now()
    };

    // Create a URL that staff can scan to view reservation details
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkInUrl = `${baseUrl}/staff/check-in/${reservationId}`;

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(checkInUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse QR code data from URL
 * @param url The scanned URL
 * @returns Reservation ID if valid, null otherwise
 */
export function parseQRCodeUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Expected format: /staff/check-in/{reservationId}
    if (pathParts.length >= 4 && pathParts[1] === 'staff' && pathParts[2] === 'check-in') {
      return pathParts[3];
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing QR code URL:', error);
    return null;
  }
}

/**
 * Validate if QR code is for this app
 * @param url The scanned URL
 * @returns boolean indicating if it's a valid reservation QR code
 */
export function isValidReservationQRCode(url: string): boolean {
  const reservationId = parseQRCodeUrl(url);
  return reservationId !== null && reservationId.length > 0;
} 