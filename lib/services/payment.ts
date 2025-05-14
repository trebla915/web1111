import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CostBreakdown {
  tablePrice: number;
  bottlesCost: number;
  mixersCost: number;
  serviceFee: number;
  total: number;
}

export interface PaymentIntentRequest {
  amount: number;
  metadata: {
    name: string;
    email: string;
    eventName: string;
    tableNumber: string;
    guests: string;
  };
  reservationId: string;
  eventId: string;
  userId: string;
}

export const PaymentService = {
  /**
   * Create a payment intent with Stripe
   */
  createPaymentIntent: async (amount: number, metadata: PaymentIntentRequest['metadata'], reservationDetails: { userId: string; eventId: string; tableId: string; reservationId: string }): Promise<PaymentIntent> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.payments.createIntent, {
        amount,
        metadata,
        reservationId: reservationDetails.reservationId,
        eventId: reservationDetails.eventId,
        userId: reservationDetails.userId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm a payment
   */
  confirmPayment: async (paymentId: string): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.payments.confirm(paymentId));
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  /**
   * Format the cost breakdown for display
   */
  formatCostBreakdown: (tablePrice: number, bottles: any[] = [], mixers: any[] = []): CostBreakdown => {
    const bottlesCost = bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
    const mixersCost = mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
    const subtotal = tablePrice + bottlesCost + mixersCost;
    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;

    return {
      tablePrice,
      bottlesCost,
      mixersCost,
      serviceFee,
      total
    };
  }
};

// Direct export of formatCostBreakdown function
export const formatCostBreakdown = (reservationDetails: any): CostBreakdown => {
  const tablePrice = reservationDetails.tablePrice || 0;
  const bottles = reservationDetails.bottles || [];
  const mixers = reservationDetails.mixers || [];
  
  const bottlesCost = bottles.reduce((total: number, bottle: any) => total + (bottle.price || 0), 0);
  const mixersCost = mixers.reduce((total: number, mixer: any) => total + (mixer.price || 0), 0);
  const subtotal = tablePrice + bottlesCost + mixersCost;
  const serviceFee = subtotal * 0.1; // 10% service fee
  const total = subtotal + serviceFee;

  return {
    tablePrice,
    bottlesCost,
    mixersCost,
    serviceFee,
    total
  };
}; 