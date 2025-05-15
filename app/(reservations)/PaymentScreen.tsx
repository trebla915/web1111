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
import { formatCostBreakdown, calculateFullCostBreakdown } from '../../src/utils/paymentUtils';
import { HandlePaymentFlowParams } from '../../src/types/paymentTypes';
import firestore from '@react-native-firebase/firestore';
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
  detailText: { color: '#aaa', marginTop: 10 },
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

  // Get bottle minimum from reservationDetails or default to 0
  const bottleMinimum = reservationDetails?.bottleMinimum || 0;
  const costBreakdown = calculateFullCostBreakdown({
    tablePrice: reservationDetails?.tablePrice,
    bottles: reservationDetails?.bottles,
    mixers: reservationDetails?.mixers,
    bottleMinimum,
  });

  const handlePayment = async () => {
    if (!isDataReady) {
      Alert.alert(
        'Incomplete Information',
        'Please ensure all reservation details are loaded correctly.',
        [{ text: 'OK', onPress: () => console.log('Validation failed') }]
      );
      return;
    }
    if (!costBreakdown.bottleMinimumMet) {
      Alert.alert(
        'Bottle Minimum Not Met',
        `You must select at least ${costBreakdown.bottleMinimum} bottle(s) to reserve this table.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const totalAmount = Math.round(costBreakdown.total * 100);

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

    const paymentRef = firestore().collection('payments').doc(paymentId);

    const unsubscribe = paymentRef.onSnapshot((docSnapshot) => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Cost Breakdown</Text>
      <Text style={styles.detailText}>Table: ${costBreakdown.table.toFixed(2)}</Text>
      <Text style={styles.detailText}>Bottles: ${costBreakdown.bottles.toFixed(2)}</Text>
      <Text style={styles.detailText}>Mixers: ${costBreakdown.mixers.toFixed(2)}</Text>
      <Text style={styles.detailText}>Sales Tax (8.25%): ${costBreakdown.salesTax.toFixed(2)}</Text>
      <Text style={styles.detailText}>Gratuity (18% on bottles): ${costBreakdown.bottleGratuity.toFixed(2)}</Text>
      <Text style={styles.detailText}>Service Fee: ${costBreakdown.serviceFee.toFixed(2)}</Text>
      <Text style={styles.sectionTitle}>Grand Total: ${costBreakdown.total.toFixed(2)}</Text>
      {!costBreakdown.bottleMinimumMet && (
        <Text style={{ color: 'red', marginTop: 10 }}>
          You must select at least {costBreakdown.bottleMinimum} bottle(s) to reserve this table.
        </Text>
      )}
      <Text style={{ color: '#aaa', marginTop: 10 }}>* An automatic 18% gratuity is applied to all bottle purchases at checkout.</Text>
      <Text style={{ color: '#aaa', marginTop: 2 }}>* Sales tax of 8.25% is applied to all purchases except gratuity and processing fees.</Text>
      <TouchableOpacity
        style={[styles.paymentButton, { backgroundColor: isDataReady && costBreakdown.bottleMinimumMet ? '#fff' : '#666' }]}
        onPress={handlePayment}
        disabled={!isDataReady || !costBreakdown.bottleMinimumMet}
      >
        <Text style={styles.buttonText}>Pay Now</Text>
      </TouchableOpacity>
    </View>
  );
}
