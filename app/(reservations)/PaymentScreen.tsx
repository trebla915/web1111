import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../../src/contexts/UserContext';
import { useStripePayment } from '../../src/hooks/useStripePayment';
import { formatCostBreakdown } from '../../src/utils/paymentUtils';
import { HandlePaymentFlowParams } from '../../src/types/paymentTypes';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/config/firebase.native';
import { createReservation } from '../../src/utils/reservations';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  sectionTitle: { fontSize: 18, color: '#fff', marginBottom: 20 },
  paymentButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#000', fontWeight: 'bold' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: { color: '#fff', marginTop: 10 },
});

export default function PaymentScreen() {
  const router = useRouter();
  const { reservationDetails, userData, isLoading } = useUser();
  const { handlePaymentFlow } = useStripePayment();

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const returnURL =
    Constants.appOwnership === 'expo'
      ? Linking.createURL('/--/')
      : Linking.createURL('');

  const isDataReady =
    !isLoading &&
    reservationDetails?.eventId &&
    reservationDetails?.eventName &&
    reservationDetails?.tableId &&
    reservationDetails?.tableNumber !== undefined &&
    reservationDetails?.guestCount !== undefined &&
    userData?.id &&
    userData?.email;

  const calculateTotal = (): number => {
    if (!reservationDetails) {
      return 0;
    }

    const tablePrice = reservationDetails?.tablePrice || 0;
    const bottlesCost =
      reservationDetails?.bottles?.reduce((acc, bottle) => acc + (bottle.price || 0), 0) || 0;
    const mixersCost =
      reservationDetails?.mixers?.reduce((acc, mixer) => acc + (mixer.price || 0), 0) || 0;

    const subtotal = tablePrice + bottlesCost + mixersCost;
    const serviceFee = subtotal * 0.029 + 0.3;

    const total = subtotal + serviceFee;

    return total;
  };

  const handlePayment = async () => {
    if (!isDataReady) {
      Alert.alert(
        'Incomplete Information',
        'Please ensure all reservation details are loaded correctly.',
        [{ text: 'OK', onPress: () => console.log('Validation failed') }]
      );
      return;
    }

    const totalAmount = Math.round(calculateTotal() * 100);

    try {
      const paymentParams: HandlePaymentFlowParams = {
        totalAmount,
        reservationDetails: {
          eventId: reservationDetails?.eventId ?? '',
          eventName: reservationDetails?.eventName ?? '',
          tableId: reservationDetails?.tableId ?? '',
          tableNumber: reservationDetails?.tableNumber ?? 0,
          guestCount: reservationDetails?.guestCount ?? 1,
          bottles: reservationDetails?.bottles?.map((bottle) => bottle.id) ?? [],
          mixers: reservationDetails?.mixers?.map((mixer) => mixer.id) ?? [],
          eventDate: reservationDetails?.eventDate ?? '',
          name: userData?.name ?? 'Guest',
          email: userData?.email ?? '',
          userId: userData?.id ?? '',
        },
        userData: {
          userId: userData?.id,
          name: userData?.name ?? 'Guest',
          email: userData?.email ?? '',
        },
        onSuccess: () => {
          console.log('Payment succeeded');
        },
      };

      const paymentId = await handlePaymentFlow(paymentParams);
      setPaymentId(paymentId);
      setIsProcessing(true);
    } catch (err) {
      const error = err as Error;

      if (error.message === 'The payment sheet was canceled.') {
        // Handle cancellation silently and log for debugging
        console.log('Payment process was canceled by the user.');
        // Optionally, navigate back or provide further instructions
      } else {
        console.error('Payment Error:', error.message);
        Alert.alert('Payment Processing Error', 'An unexpected error occurred during payment.', [
          { text: 'Try Again', onPress: () => setIsProcessing(false) },
        ]);
      }
    }
  };

  useEffect(() => {
    if (!paymentId) return;

    const paymentRef = doc(db, 'payments', paymentId);

    const unsubscribe = onSnapshot(paymentRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const paymentData = docSnapshot.data();

        if (paymentData.status === 'succeeded') {
          const reservationPayload = {
            paymentId,
            reservationDetails: {
              eventId: reservationDetails?.eventId ?? '',
              eventName: reservationDetails?.eventName ?? '',
              tableId: reservationDetails?.tableId ?? '',
              tableNumber: reservationDetails?.tableNumber ?? 0,
              guestCount: reservationDetails?.guestCount ?? 1,
              bottles: reservationDetails?.bottles ?? [],
              mixers: reservationDetails?.mixers ?? [],
              eventDate: reservationDetails?.eventDate ?? '',
              userName: userData?.name ?? 'Guest',
              userEmail: userData?.email ?? '',
              userId: userData?.id ?? '',
            },
          };

          createReservation(reservationPayload)
            .then(() => {
              router.push('/(reservations)/SummaryScreen');
            })
            .catch((error) => {
              console.error('Error creating reservation:', error);
              Alert.alert('Error', 'Failed to create reservation. Please try again.');
            });

          unsubscribe();
        }
      }
    });

    return () => unsubscribe();
  }, [paymentId]);

  if (isLoading || isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Processing your reservation...</Text>
      </View>
    );
  }

  const total = calculateTotal();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Grand Total: ${total.toFixed(2)}</Text>
      <TouchableOpacity
        style={[styles.paymentButton, { backgroundColor: isDataReady ? '#fff' : '#666' }]}
        onPress={handlePayment}
        disabled={!isDataReady}
      >
        <Text style={styles.buttonText}>
          {isDataReady ? 'Proceed to Payment' : 'Loading Reservation...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
