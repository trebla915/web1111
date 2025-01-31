import { apiClient } from '@/lib/utils/apiClient'; // ✅ Import apiClient

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
    guests: string;  // ✅ Added guests field
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
  return { total: Number((tablePrice + bottleTotal).toFixed(2)) }; // ✅ Always returns a number
};

// ✅ Function to create a payment intent
export const createPaymentIntent = async (data: PaymentIntentRequest) => {
  try {
    // ✅ Ensure all required fields are present
    const requiredFields = ['amount', 'metadata', 'reservationDetails'];
    const missingFields = requiredFields.filter(field => !(data as any)[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const response = await apiClient.post('/payments/create-payment-intent', {
      amount: Math.round(data.amount * 100), // ✅ Convert to cents
      metadata: {
        name: data.metadata.name,
        email: data.metadata.email,
        eventName: data.metadata.eventName,
        tableNumber: data.metadata.tableNumber,
        guests: data.metadata.guests, // ✅ Ensure guests field is included
      },
      reservationDetails: {
        userId: data.reservationDetails.userId,
        eventId: data.reservationDetails.eventId,
        tableId: data.reservationDetails.tableId,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Payment Error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Payment initialization failed'
    );
  }
};