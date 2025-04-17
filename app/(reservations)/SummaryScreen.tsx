// File: SummaryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '../../src/contexts/UserContext';

export default function SummaryScreen() {
  const router = useRouter();
  const { reservationDetails, userData } = useUser();
  const { eventTitle, eventDate } = useLocalSearchParams<{
    eventTitle: string;
    eventDate: string;
  }>();

  const handleReturnHome = () => {
    router.push('/(tabs)');
  };

  const calculateTotal = () => {
    const tablePrice = reservationDetails?.tablePrice || 0;
    const bottlesCost =
      reservationDetails?.bottles?.reduce((acc, bottle) => acc + (bottle.price || 0), 0) || 0;
    const mixersCost =
      reservationDetails?.mixers?.reduce((acc, mixer) => acc + (mixer.price || 0), 0) || 0;

    const subtotal = tablePrice + bottlesCost + mixersCost;
    const serviceFee = subtotal * 0.029 + 0.3; // 2.9% + $0.30 fixed fee
    const grandTotal = subtotal + serviceFee;

    return {
      tablePrice,
      bottlesCost,
      mixersCost,
      serviceFee,
      grandTotal,
    };
  };

  const costBreakdown = calculateTotal();

  const renderContent = () => (
    <>
      {/* Reservation Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reservation Summary</Text>
        <Text style={styles.detailText}>Name: {userData?.name || 'Unknown'}</Text>
        <Text style={styles.detailText}>
          Event: {reservationDetails?.eventName || eventTitle || 'N/A'}
        </Text>
        {eventDate && (
          <Text style={styles.eventDate}>
            Date: {new Date(eventDate).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              timeZone: 'America/Denver'
            })}
          </Text>
        )}
        <Text style={styles.detailText}>
          Table: {reservationDetails?.tableNumber || '-'}
        </Text>
        <Text style={styles.detailText}>
          Guests: {reservationDetails?.guestCount || 0}
        </Text>
      </View>

      {/* Bottles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected Bottles</Text>
        <FlatList
          data={reservationDetails?.bottles || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>${item.price.toFixed(2)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No bottles selected.</Text>
          }
        />
      </View>

      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        <Text style={styles.detailText}>
          Table Price: ${costBreakdown.tablePrice.toFixed(2)}
        </Text>
        <Text style={styles.detailText}>
          Bottles Total: ${costBreakdown.bottlesCost.toFixed(2)}
        </Text>
        <Text style={styles.detailText}>
          Mixers Total: ${costBreakdown.mixersCost.toFixed(2)}
        </Text>
        <Text style={styles.detailText}>
          Service Fee: ${costBreakdown.serviceFee.toFixed(2)}
        </Text>
        <Text style={styles.totalText}>
          Grand Total: ${costBreakdown.grandTotal.toFixed(2)}
        </Text>
      </View>

      {/* Return Button */}
      <TouchableOpacity style={styles.returnButton} onPress={handleReturnHome}>
        <Text style={styles.buttonText}>Return to Home</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <FlatList
      data={[1]} // Dummy data for rendering the content
      renderItem={renderContent}
      keyExtractor={() => 'summary-screen-content'}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  section: {
    backgroundColor: '#1c1c1c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailText: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 10,
  },
  eventDate: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 10,
  },
  totalText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
  },
  itemDetails: {
    color: '#aaa',
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
  },
  returnButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
