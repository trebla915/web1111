import { loadStripe } from '@stripe/stripe-js';
import { createPaymentIntent } from '@/lib/services/payment';
import { ReservationDetails } from '@/types/reservation';

interface HandlePaymentFlowParams {
  totalAmount: number;
  reservationDetails: ReservationDetails;
  userData: {
    userId: string;
    name: string;
    email: string;
  };
  onSuccess: () => void;
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export const useStripePayment = () => {
  const handlePaymentFlow = async ({
    totalAmount,
    reservationDetails,
    userData,
    onSuccess,
  }: HandlePaymentFlowParams): Promise<string> => {
    try {
      // Create payment intent
      const { clientSecret, paymentId } = await createPaymentIntent({
        amount: totalAmount,
        reservationDetails,
        userId: userData.userId,
        userEmail: userData.email,
        userName: userData.name,
      });

      // Load Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Create payment element
      const { error: paymentError } = await stripe.confirmPayment({
        elements: {
          clientSecret,
        },
        confirmParams: {
          return_url: `${window.location.origin}/reserve/${reservationDetails.eventId}/confirmation`,
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      onSuccess();
      return paymentId;
    } catch (error) {
      console.error('[handlePaymentFlow] Error:', error);
      throw error;
    }
  };

  return { handlePaymentFlow };
}; 