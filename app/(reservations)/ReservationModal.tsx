import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '../../src/contexts/UserContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Bottle, Mixer } from '../../src/utils/types';
import { calculateFullCostBreakdown } from '../../src/utils/paymentUtils';

// Utility to combine bottles and mixers
const getCombinedItems = (bottles: Bottle[] = [], mixers: Mixer[] = []) => [
  ...bottles,
  ...mixers.map((mixer) => ({ ...mixer, isMixer: true })),
];

// Shared error alert
const showAlert = (title: string, message: string) => {
  Alert.alert(title, message, [{ text: 'OK' }]);
};

export default function ReservationModal() {
  const router = useRouter();
  const { reservationDetails, updateReservationDetails, userData } = useUser();
  const { eventTitle, eventDate, tableId, tableNumber, eventId } = useLocalSearchParams();

  const tableCapacity = reservationDetails?.capacity || 8; // Default to 8 if not provided
  const [guestCount, setGuestCount] = useState<number>(reservationDetails?.guestCount || 1);

  const formattedEventDate = new Date(eventDate as string).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  const costBreakdown = calculateFullCostBreakdown({
    tablePrice: reservationDetails?.tablePrice,
    bottles: reservationDetails?.bottles,
    mixers: reservationDetails?.mixers,
    bottleMinimum: reservationDetails?.bottleMinimum ?? 1,
  });

  const handleOpenBottleModal = () => {
    if (!eventId) return showAlert('Error', 'Event ID is missing.');
    router.push({
      pathname: '/(reservations)/BottleSelectionModal',
      params: { eventId, eventTitle, eventDate: formattedEventDate },
    });
  };

  const handleRemoveItem = (id: string) => {
    if (!reservationDetails) return;
    updateReservationDetails({
      ...reservationDetails,
      bottles: reservationDetails.bottles?.filter((item) => item.id !== id) || [],
      mixers: reservationDetails.mixers?.filter((item) => item.id !== id) || [],
    });
  };

  const handleContinueToPayment = () => {
    if (!eventId || !tableId || !guestCount)
      return Alert.alert('Error', 'Missing reservation details. Please complete your selections.');

    const eventName = eventTitle as string;

    updateReservationDetails({
      ...reservationDetails,
      guestCount,
      capacity: tableCapacity,
      eventId: String(eventId),
      eventName,
      tableId: String(tableId),
      tableNumber: Number(tableNumber),
      eventDate: formattedEventDate,
      name: userData?.name ?? 'Guest',
      email: userData?.email ?? '',
    });

    router.push({
      pathname: '/(reservations)/PaymentScreen',
      params: {
        eventId: String(eventId),
        eventTitle,
        eventDate: formattedEventDate,
        tableId: String(tableId),
        tableNumber: Number(tableNumber),
        guestCount,
        capacity: tableCapacity,
      },
    });
  };

  const combinedItems = getCombinedItems(reservationDetails?.bottles, reservationDetails?.mixers);

  return (
    <View style={styles.container}>
      <View style={styles.detailsContainer}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>
        <Text style={styles.eventDate}>{formattedEventDate}</Text>
        <Text style={styles.eventTable}>Table: {tableNumber}</Text>
      </View>

      <View style={styles.costBreakdown}>
        <Text style={styles.costTitle}>Cost Breakdown</Text>
        <Text style={styles.costItem}>Table Price: ${costBreakdown.table.toFixed(2)}</Text>
        <Text style={styles.costItem}>Bottles: ${costBreakdown.bottles.toFixed(2)}</Text>
        <Text style={styles.costItem}>Mixers: ${costBreakdown.mixers.toFixed(2)}</Text>
        <Text style={styles.costItem}>Sales Tax (8.25%): ${costBreakdown.salesTax.toFixed(2)}</Text>
        <Text style={styles.costItem}>Gratuity (18% on bottles): ${costBreakdown.bottleGratuity.toFixed(2)}</Text>
        <Text style={styles.costItem}>Service Fee: ${costBreakdown.serviceFee.toFixed(2)}</Text>
        <Text style={styles.costItem}>Subtotal: ${costBreakdown.subtotal.toFixed(2)}</Text>
        <Text style={styles.totalCost}>Grand Total: ${costBreakdown.total.toFixed(2)}</Text>
        {!costBreakdown.bottleMinimumMet && (
          <Text style={{ color: 'orange', marginTop: 10 }}>
            You must select at least {costBreakdown.bottleMinimum} bottle(s) to reserve this table.
          </Text>
        )}
      </View>

      <View style={styles.guestCountContainer}>
        <Text style={styles.guestLabel}>Select Guests Amount: </Text>
        <View style={styles.guestControl}>
          <TouchableOpacity
            onPress={() => setGuestCount((prev) => Math.max(prev - 1, 1))}
            style={styles.roundButton}
          >
                                  <MaterialIcons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.guestCount}>{guestCount}</Text>
          <TouchableOpacity
            onPress={() => setGuestCount((prev) => Math.min(prev + 1, tableCapacity))}
            style={styles.roundButton}
          >
                                  <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={handleOpenBottleModal} style={styles.bottleButton}>
        <Text style={styles.bottleButtonText}>Choose Bottles</Text>
      </TouchableOpacity>

      {combinedItems.length > 0 && (
        <View style={styles.selectedItemsContainer}>
          <Text style={styles.selectedItemsTitle}>Your setup includes:</Text>
          <FlatList
            data={combinedItems}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View>
                  <Text style={styles.itemName}>
                    {('isMixer' in item && item.isMixer) ? 'Mixer: ' : ''}
                    {item.name}
                  </Text>
                  <Text style={styles.itemDetails}>${item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={handleOpenBottleModal}>
                    <MaterialIcons name="edit" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                                          <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <TouchableOpacity
        onPress={handleContinueToPayment}
        style={[styles.paymentButton, { backgroundColor: costBreakdown.bottleMinimumMet ? '#fff' : '#666' }]}
        disabled={!costBreakdown.bottleMinimumMet}
      >
        <Text style={styles.paymentButtonText}>
          {costBreakdown.bottleMinimumMet
            ? 'Continue to Payment'
            : `Add Required Bottles (${costBreakdown.bottleMinimum - (reservationDetails?.bottles?.length || 0)} More)`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  detailsContainer: { alignItems: 'center', marginBottom: 20 },
  eventTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  eventDate: { fontSize: 16, color: '#aaa', marginVertical: 5 },
  eventTable: { fontSize: 16, color: '#fff', marginVertical: 5 },
  costBreakdown: { marginVertical: 20 },
  costTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  costItem: { fontSize: 16, color: '#aaa', marginBottom: 5 },
  totalCost: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  guestCountContainer: { alignItems: 'center', marginBottom: 20 },
  guestLabel: { fontSize: 18, color: '#fff', marginBottom: 10 },
  guestControl: { flexDirection: 'row', alignItems: 'center' },
  guestCount: { fontSize: 24, color: '#fff', marginHorizontal: 20 },
  roundButton: { backgroundColor: '#444', padding: 15, borderRadius: 30 },
  bottleButton: { backgroundColor: '#000', borderWidth: 1, borderColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 20 },
  bottleButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  selectedItemsContainer: { flex: 1, backgroundColor: '#1c1c1c', padding: 15, borderRadius: 10 },
  selectedItemsTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { fontSize: 16, color: '#fff' },
  itemDetails: { fontSize: 14, color: '#aaa' },
  itemActions: { flexDirection: 'row', gap: 15 },
  paymentButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  paymentButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
