import { apiClient } from '@/lib/utils/apiClient';

interface Bottle {
  id: string;
  name: string;
  price: number;
}

interface PaymentIntentRequest {
  amount: number;
  metadata: {
    name: string;
    email: string;
    eventName: string;
    tableNumber: string;
    guests: string;
  };
  reservationDetails: {
    userId: string;
    eventId: string;
    tableId: string;
  };
}

// ✅ Function to calculate total cost
export const calculateTotal = (tablePrice: number, bottles: Bottle[]) => {
  const bottleTotal = bottles.reduce((sum, bottle) => sum + bottle.price, 0);
  return { total: Number((tablePrice + bottleTotal).toFixed(2)) };
};

// ✅ Function to create a payment intent
export const createPaymentIntent = async (data: PaymentIntentRequest) => {
  try {
    // ✅ Ensure all required fields are present
    const requiredFields: (keyof PaymentIntentRequest)[] = ['amount', 'metadata', 'reservationDetails'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const response = await apiClient.post('/payments/create-payment-intent', {
      amount: Math.round(data.amount * 100), // ✅ Convert to cents
      metadata: { ...data.metadata },
      reservationDetails: { ...data.reservationDetails },
    });

    return response.data;
  } catch (error) {
    console.error('Payment Error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Payment initialization failed'
    );
  }
};