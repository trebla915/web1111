import { apiClient } from './api';

/**
 * Creates a PaymentIntent via the backend and returns the client secret and payment ID.
 * Ensures the proper structure for Firebase and Stripe.
 *
 * @param totalAmount - The total amount to be charged, in cents.
 * @param metadata - Metadata to associate with the PaymentIntent for Stripe.
 * @param reservationDetails - Detailed reservation data to store in Firestore.
 * @returns A promise with the client secret and payment ID for the PaymentIntent.
 */
export const createPaymentIntent = async (
  totalAmount: number,
  metadata: {
    name: string;
    email: string;
    eventName: string;
    tableNumber: string | number;
  },
  reservationDetails: {
    userId: string;
    eventId: string;
    tableId: string;
  }
): Promise<{ clientSecret: string; paymentId: string }> => {
  try {
    console.log('[createPaymentIntent] Inputs:', {
      totalAmount,
      metadata,
      reservationDetails,
    });

    // Validate inputs
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      throw new Error('Invalid amount specified.');
    }

    if (!metadata.name || !metadata.email || !metadata.eventName) {
      throw new Error('Missing required metadata fields.');
    }

    if (!reservationDetails.eventId || !reservationDetails.tableId || !reservationDetails.userId) {
      throw new Error('Missing required reservation details.');
    }

    // Normalize metadata for Stripe
    const normalizedMetadata = {
      name: metadata.name,
      email: metadata.email,
      eventName: metadata.eventName,
      tableNumber: metadata.tableNumber.toString(),
    };

    // Prepare request body for backend
    const requestBody = {
      amount: totalAmount,
      metadata: normalizedMetadata,
      reservationDetails: {
        userId: reservationDetails.userId,
        eventId: reservationDetails.eventId,
        tableId: reservationDetails.tableId,
      },
    };

    // Send request to the backend
    const response = await apiClient.post('/payments/create-payment-intent', requestBody);

    // Extract clientSecret and paymentId from the response
    const { clientSecret, paymentId } = response.data;

    if (!clientSecret || !paymentId) {
      throw new Error('Failed to retrieve client secret or payment ID.');
    }

    console.log('[createPaymentIntent] Success:', { clientSecret, paymentId });

    return { clientSecret, paymentId };
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      console.error('[createPaymentIntent] Error:', error.message);
      throw new Error(`Payment Intent Creation Failed: ${error.message}`);
    } else {
      console.error('[createPaymentIntent] Unknown Error:', error);
      throw new Error('An unknown error occurred during payment intent creation.');
    }
  }
};

/**
 * Format cost breakdown for a PaymentIntent.
 * Computes costs for guests, bottles, mixers, and a fixed deposit.
 *
 * @param reservationDetails - Reservation details.
 * @returns An object with the formatted cost breakdown.
 */
export const formatCostBreakdown = (reservationDetails: {
  guestCount?: number;
  bottles?: Array<{ price: number }>;
  mixers?: Array<{ price: number }>;
}): { guests: number; bottles: number; mixers: number; deposit: number } => {
  const guestCost = (reservationDetails.guestCount || 0) * 50; // $50 per guest
  const bottlesCost =
    reservationDetails.bottles?.reduce((total, bottle) => total + (bottle.price || 0), 0) || 0;
  const mixersCost =
    reservationDetails.mixers?.reduce((total, mixer) => total + (mixer.price || 0), 0) || 0;

  return {
    guests: guestCost,
    bottles: bottlesCost,
    mixers: mixersCost,
    deposit: 100, // Fixed deposit for every reservation
  };
};