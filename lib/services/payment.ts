import { ReservationDetails } from '@/types/reservation';
import { db } from '@/lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface CreatePaymentIntent {
  reservationDetails: ReservationDetails;
  amount: number;
  userId: string;
  userEmail: string;
  userName: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
}

/**
 * Create a payment intent in Firestore
 * This would trigger a Cloud Function that creates a Stripe Payment Intent
 */
export const createPaymentIntent = async (data: CreatePaymentIntent): Promise<PaymentIntentResponse> => {
  try {
    // Validate inputs
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      throw new Error('Invalid amount specified.');
    }

    if (!data.userName || !data.userEmail) {
      throw new Error('Missing required user information.');
    }

    if (!data.reservationDetails.eventId || !data.reservationDetails.tableId) {
      throw new Error('Missing required reservation details.');
    }

    const paymentData = {
      amount: data.amount,
      currency: 'usd',
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      status: 'pending',
      createdAt: serverTimestamp(),
      metadata: {
        eventId: data.reservationDetails.eventId,
        eventName: data.reservationDetails.eventName,
        tableId: data.reservationDetails.tableId,
        tableNumber: data.reservationDetails.tableNumber
      }
    };
    
    const paymentsCollection = collection(db, 'payments');
    const docRef = await addDoc(paymentsCollection, paymentData);
    
    // In a real implementation, this would come from your Stripe integration
    // For now, we'll return a mock client secret
    return {
      clientSecret: 'mock_client_secret',
      paymentId: docRef.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Calculate the total cost of a reservation
 */
export const calculateTotal = (reservationDetails: ReservationDetails): number => {
  const tablePrice = reservationDetails.tablePrice || 0;
  const bottlesCost = 
    reservationDetails.bottles?.reduce((acc, bottle) => acc + bottle.price, 0) || 0;
  const mixersCost = 
    reservationDetails.mixers?.reduce((acc, mixer) => acc + mixer.price, 0) || 0;

  const subtotal = tablePrice + bottlesCost + mixersCost;
  const serviceFee = subtotal * 0.029 + 0.3; // 2.9% + $0.30 fixed fee

  return Math.round((subtotal + serviceFee) * 100) / 100; // Round to 2 decimal places
};

/**
 * Format cost breakdown for display
 */
export const formatCostBreakdown = (reservationDetails: ReservationDetails) => {
  const tablePrice = reservationDetails.tablePrice || 0;
  const bottlesCost = 
    reservationDetails.bottles?.reduce((acc, bottle) => acc + bottle.price, 0) || 0;
  const mixersCost = 
    reservationDetails.mixers?.reduce((acc, mixer) => acc + mixer.price, 0) || 0;

  const subtotal = tablePrice + bottlesCost + mixersCost;
  const serviceFee = subtotal * 0.029 + 0.3;
  const total = subtotal + serviceFee;

  return {
    tablePrice,
    bottlesCost,
    mixersCost,
    serviceFee,
    subtotal,
    total
  };
}; 