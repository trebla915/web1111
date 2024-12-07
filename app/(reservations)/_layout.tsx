// File: ReservationsLayout.tsx
// Summary: Manages the reservation-related navigation stack, including table selection, payment, and summary flows.

import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import HeaderRight from '../../src/components/HeaderRight'; // Import the reusable HeaderRight component

// Shared header options for consistency
const headerOptions = {
  headerStyle: {
    backgroundColor: '#1c1c1c', // Dark header background
  },
  headerTintColor: '#ffffff', // White header text
  headerTitleStyle: {
    fontWeight: 'bold' as 'bold', // Explicitly set to a valid value
  },
  presentation: 'card' as 'card', // Explicitly cast presentation to a valid type
};

export default function ReservationsLayout() {
  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        headerRight: () => <HeaderRight />, // Reusable HeaderRight component
      }}
    >
      <Stack.Screen
        name="TableSelection"
        options={{ title: 'Table Selection' }}
      />
      <Stack.Screen
        name="ReservationModal"
        options={{ title: 'Reservation Details' }}
      />
      <Stack.Screen
        name="PaymentScreen"
        options={{ title: 'Payment' }}
      />
      <Stack.Screen
        name="SummaryScreen"
        options={{ title: 'Summary' }}
      />
      <Stack.Screen
        name="BottleSelectionModal"
        options={{
          title: 'Select Bottles',
          presentation: 'modal' as 'modal', // Explicitly cast to a valid type
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
