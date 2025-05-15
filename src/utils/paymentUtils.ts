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
      amount: Math.round(totalAmount), // Ensure amount is an integer in cents
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
 * Computes costs for table, bottles, mixers, and service fees.
 *
 * @param reservationDetails - Reservation details including table and items.
 * @returns An object with the formatted cost breakdown.
 */
export const formatCostBreakdown = (reservationDetails: {
  tablePrice?: number;
  bottles?: Array<{ price: number }>;
  mixers?: Array<{ price: number }>;
}): {
  table: number;
  bottles: number;
  mixers: number;
  serviceFee: number;
  subtotal: number;
  total: number;
} => {
  const tableCost = reservationDetails.tablePrice || 0;
  const bottlesCost =
    reservationDetails.bottles?.reduce((total, bottle) => total + (bottle.price || 0), 0) || 0;
  const mixersCost =
    reservationDetails.mixers?.reduce((total, mixer) => total + (mixer.price || 0), 0) || 0;

  const subtotal = tableCost + bottlesCost + mixersCost;
  const serviceFee = subtotal * 0.029 + 0.3; // 2.9% + $0.30 fixed fee
  const total = subtotal + serviceFee;

  return {
    table: tableCost,
    bottles: bottlesCost,
    mixers: mixersCost,
    serviceFee,
    subtotal,
    total,
  };
};

/**
 * Utility to calculate and display total cost breakdown.
 * Includes table price, bottles, mixers, and service fee.
 *
 * @param reservationDetails - The reservation details.
 * @returns A formatted breakdown of all costs.
 */
export const calculateTotalCost = (reservationDetails: {
  tablePrice?: number;
  bottles?: Array<{ price: number }>;
  mixers?: Array<{ price: number }>;
}): { total: number; breakdown: string } => {
  const { table, bottles, mixers, serviceFee, subtotal, total } = formatCostBreakdown(
    reservationDetails
  );

  const breakdown = `
    Table: $${table.toFixed(2)}
    Bottles: $${bottles.toFixed(2)}
    Mixers: $${mixers.toFixed(2)}
    Service Fee: $${serviceFee.toFixed(2)}
    Subtotal: $${subtotal.toFixed(2)}
    Total: $${total.toFixed(2)}
  `;

  return { total, breakdown };
};

// Constants for tax and gratuity
const SALES_TAX_RATE = 0.0825;
const BOTTLE_GRATUITY_RATE = 0.18;

export interface CostBreakdown {
  table: number;
  bottles: number;
  mixers: number;
  serviceFee: number;
  salesTax: number;
  bottleGratuity: number;
  subtotal: number;
  total: number;
  bottleMinimumMet: boolean;
  bottleMinimum: number;
}

/**
 * Calculates the full cost breakdown for a reservation, including sales tax, bottle gratuity, and bottle minimum enforcement.
 * @param reservationDetails - Reservation details including table, bottles, mixers, and bottleMinimum.
 * @returns Cost breakdown and bottle minimum status.
 */
export function calculateFullCostBreakdown(reservationDetails: {
  tablePrice?: number;
  bottles?: Array<{ price: number }>;
  mixers?: Array<{ price: number }>;
  bottleMinimum?: number;
}): CostBreakdown {
  const table = reservationDetails.tablePrice || 0;
  const bottles = reservationDetails.bottles?.reduce((acc, b) => acc + (b.price || 0), 0) || 0;
  const mixers = reservationDetails.mixers?.reduce((acc, m) => acc + (m.price || 0), 0) || 0;
  const bottleMinimum = reservationDetails.bottleMinimum || 0;
  const bottleCount = reservationDetails.bottles?.length || 0;
  const bottleMinimumMet = bottleCount >= bottleMinimum;

  const subtotal = table + bottles + mixers;
  const salesTax = subtotal * SALES_TAX_RATE;
  const bottleGratuity = bottles * BOTTLE_GRATUITY_RATE;
  const serviceFee = (subtotal + salesTax + bottleGratuity) * 0.029 + 0.3; // Stripe fee on total
  const total = subtotal + salesTax + bottleGratuity + serviceFee;

  return {
    table,
    bottles,
    mixers,
    serviceFee,
    salesTax,
    bottleGratuity,
    subtotal,
    total,
    bottleMinimumMet,
    bottleMinimum,
  };
}
