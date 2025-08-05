import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface PaymentIntent {
  clientSecret: string;
  paymentId: string;
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
    // Customer Information
    name: string;
    email: string;
    phone: string;
    
    // Event Information
    eventName: string;
    eventId: string;
    eventDate: string;
    
    // Table Information
    tableNumber: string;
    tableId: string;
    tablePrice: string;
    
    // Reservation Details
    guests: string;
    reservationTime: string;
    
    // Bottle & Mixer Information
    bottleCount: string;
    bottlesOrdered: string;
    bottlesCost: string;
    mixerCount: string;
    mixersOrdered: string;
    mixersCost: string;
    
    // Financial Information
    subtotal: string;
    totalAmount: string;
    
    // System Information
    userId: string;
    platform: string;
    source: string;
  };
  reservationDetails: {
    userId: string;
    eventId: string;
    tableId: string;
  };
}

export const PaymentService = {
  /**
   * Create a payment intent with Stripe
   * @param amount Amount in cents (already converted from dollars)
   * @param metadata Additional payment metadata
   * @param reservationDetails Reservation information
   */
  createPaymentIntent: async (
    amount: number,
    metadata: PaymentIntentRequest['metadata'],
    reservationDetails: PaymentIntentRequest['reservationDetails']
  ): Promise<PaymentIntent> => {
    try {
      // Amount is already in cents from the calling code
      const amountInCents = amount;
      
      const response = await apiClient.post(API_ENDPOINTS.payments.createIntent, {
        amount: amountInCents,
        metadata,
        reservationDetails
      });

      return {
        clientSecret: response.data.clientSecret,
        paymentId: response.data.paymentId
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent. Please try again.');
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