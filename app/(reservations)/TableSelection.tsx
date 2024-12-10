import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { fetchAllTablesForEvent } from '../../src/utils/tables';
import { useUser } from '../../src/contexts/UserContext';
import ClubLayout from './ClubLayout';
import { FrontendTable } from '../../src/utils/types';
import { Pressable } from 'react-native';

const TableSelection: React.FC = () => {
  const router = useRouter();
  const { setReservationDetails, userData } = useUser();
  const { eventId, eventTitle, eventDate } = useLocalSearchParams<{
    eventId: string;
    eventTitle: string;
    eventDate: string;
  }>();

  const [tables, setTables] = useState<FrontendTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedTables = await fetchAllTablesForEvent(eventId);
      setTables(fetchedTables);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setError('Failed to fetch tables. Please try again later.');
      Alert.alert('Error', 'Unable to load tables. Please try again.', [
        { text: 'OK', onPress: () => router.replace('/events') },
      ]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      if (eventId) fetchTables();
    }, [eventId, fetchTables])
  );

  const handleTableSelection = (tableId: string) => {
    const selectedTable = tables.find((table) => table.id === tableId);
    if (!selectedTable || !eventId || !userData?.id) {
      Alert.alert('Error', 'Unable to proceed. Please check your selection and try again.');
      return;
    }
  
    setReservationDetails({
      id: `temp-${Date.now()}`,
      eventId,
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      capacity: selectedTable.capacity, // Include capacity from the backend
      userId: userData.id,
      reservationTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      guestCount: 1,
      bottles: [],
      tablePrice: selectedTable.price, // Include table price
    });
  
    router.push({
      pathname: '/(reservations)/ReservationModal',
      params: {
        eventId,
        eventTitle,
        eventDate,
        tableId: selectedTable.id,
        tableNumber: selectedTable.number.toString(),
      },
    });
  };
  

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Loading tables...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.replace('/events')}
        >
          <Text style={styles.retryButtonText}>Back to Events</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://via.placeholder.com/300' }}
        style={styles.eventImage}
        resizeMode="cover"
      />
      <View style={styles.eventDetailsContainer}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>
        {eventDate && <Text style={styles.eventDate}>Date: {eventDate}</Text>}
      </View>
      <ClubLayout
        tables={tables}
        onTableSelect={handleTableSelection}
        showTablePrice // Ensure ClubLayout can display table prices
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 10,
  },
  eventImage: {
    width: Dimensions.get('window').width - 20,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  eventDetailsContainer: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  eventDate: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6200ea',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

export default TableSelection;
