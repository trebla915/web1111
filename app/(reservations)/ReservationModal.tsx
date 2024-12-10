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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Bottle, Mixer } from '../../src/utils/types';

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

  const calculateTotalCost = () => {
    const tablePrice = reservationDetails?.tablePrice || 0;
    const bottlesCost =
      reservationDetails?.bottles?.reduce((total, bottle) => total + bottle.price, 0) || 0;
    const mixersCost =
      reservationDetails?.mixers?.reduce((total, mixer) => total + mixer.price, 0) || 0;
    const serviceFee = (tablePrice + bottlesCost + mixersCost) * 0.029 + 0.3;

    return {
      tablePrice,
      bottlesCost,
      mixersCost,
      serviceFee,
      total: tablePrice + bottlesCost + mixersCost + serviceFee,
    };
  };

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
  const costBreakdown = calculateTotalCost();

  return (
    <View style={styles.container}>
      <View style={styles.detailsContainer}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>
        <Text style={styles.eventDate}>{formattedEventDate}</Text>
        <Text style={styles.eventTable}>Table: {tableNumber}</Text>
      </View>

      <View style={styles.costBreakdown}>
        <Text style={styles.costTitle}>Cost Breakdown</Text>
        <Text style={styles.costItem}>Table Price: ${costBreakdown.tablePrice.toFixed(2)}</Text>
        <Text style={styles.costItem}>Bottles: ${costBreakdown.bottlesCost.toFixed(2)}</Text>
        <Text style={styles.costItem}>Mixers: ${costBreakdown.mixersCost.toFixed(2)}</Text>
        <Text style={styles.costItem}>Service Fee: ${costBreakdown.serviceFee.toFixed(2)}</Text>
        <Text style={styles.totalCost}>Total: ${costBreakdown.total.toFixed(2)}</Text>
      </View>

      <View style={styles.guestCountContainer}>
        <Text style={styles.guestLabel}>Select Guests Amount: </Text>
        <View style={styles.guestControl}>
          <TouchableOpacity
            onPress={() => setGuestCount((prev) => Math.max(prev - 1, 1))}
            style={styles.roundButton}
          >
            <Icon name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.guestCount}>{guestCount}</Text>
          <TouchableOpacity
            onPress={() => setGuestCount((prev) => Math.min(prev + 1, tableCapacity))}
            style={styles.roundButton}
          >
            <Icon name="add" size={24} color="#fff" />
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
                    <Icon name="edit" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <Icon name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <TouchableOpacity onPress={handleContinueToPayment} style={styles.paymentButton}>
        <Text style={styles.paymentButtonText}>Continue to Payment</Text>
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
