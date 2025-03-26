import { apiClient, handleApiError } from './api';
import { ReservationDetails } from './types';

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
}

interface CostBreakdown {
  tablePrice: number;
  bottlesCost: number;
  mixersCost: number;
  serviceFee: number;
  total: number;
}

/**
 * Create a payment intent for a reservation
 */
export const createPaymentIntent = async (
  reservationDetails: ReservationDetails,
  userId: string
): Promise<PaymentIntent | null> => {
  try {
    const response = await apiClient.post<PaymentIntent>('/payments/create-intent', {
      reservationDetails,
      userId
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'create payment intent');
    throw error;
  }
};

/**
 * Calculate the cost breakdown for a reservation
 */
export const formatCostBreakdown = (reservationDetails: ReservationDetails): CostBreakdown => {
  const tablePrice = reservationDetails.tablePrice || 0;
  
  const bottlesCost = 
    reservationDetails.bottles?.reduce((sum, bottle) => sum + bottle.price, 0) || 0;
  
  const mixersCost = 
    reservationDetails.mixers?.reduce((sum, mixer) => sum + mixer.price, 0) || 0;
  
  const subtotal = tablePrice + bottlesCost + mixersCost;
  const serviceFee = Math.round(subtotal * 0.029 + 0.3 * 100) / 100; // 2.9% + $0.30 fixed fee
  
  const total = subtotal + serviceFee;
  
  return {
    tablePrice,
    bottlesCost,
    mixersCost,
    serviceFee,
    total
  };
};

/**
 * Calculate total cost in cents (for Stripe)
 */
export const calculateTotalInCents = (reservationDetails: ReservationDetails): number => {
  const { total } = formatCostBreakdown(reservationDetails);
  return Math.round(total * 100);
}; 