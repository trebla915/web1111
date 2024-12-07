import { useStripe } from '@stripe/stripe-react-native';
import { createPaymentIntent } from '../utils/paymentUtils';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { HandlePaymentFlowParams } from '../types/paymentTypes'; // Import shared interface

export const useStripePayment = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handlePaymentFlow = async ({
    totalAmount,
    reservationDetails,
    userData,
    onSuccess,
  }: HandlePaymentFlowParams): Promise<string> => {
    try {
      const metadata = {
        name: userData.name,
        email: userData.email,
        eventName: reservationDetails.eventName,
        tableNumber: reservationDetails.tableNumber.toString(),
      };
  
      const response = await createPaymentIntent(totalAmount, metadata, {
        eventId: reservationDetails.eventId, // Pass these values correctly
        tableId: reservationDetails.tableId,
        userId: reservationDetails.userId, // Now part of reservationDetails
      });
  
      const { clientSecret, paymentId } = response;
  
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Club 1111',
      });
  
      if (initError) throw new Error(initError.message);
  
      const { error: presentError } = await presentPaymentSheet();
  
      if (presentError) throw new Error(presentError.message);
  
      onSuccess();
  
      return paymentId;
    } catch (error) {
      console.error('[handlePaymentFlow] Error:', error);
      throw new Error('Payment process failed.');
    }
  };

  return { handlePaymentFlow };
};