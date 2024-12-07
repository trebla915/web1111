import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserReservations, deleteReservation } from '../../src/utils/reservations';
import Toast from 'react-native-toast-message';
import { Reservation } from '../../src/utils/types';
import { useLoading } from '../../src/contexts/LoadingContext'; // Import global loading context

const ReservationsScreen: React.FC = () => {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const { setLoading } = useLoading(); // Use the global loading context
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState(false);
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);

  useEffect(() => {
    if (firebaseUser) {
      loadReservations();
    } else {
      router.replace('/(auth)/Login');
    }
  }, [firebaseUser]);

  /**
   * Fetches user reservations using the utility function.
   */
  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(false);

      if (!firebaseUser?.uid) {
        throw new Error('User ID is missing.');
      }

      const userReservations = await getUserReservations(firebaseUser.uid);

      console.log('Fetched Reservations:', userReservations);

      if (!userReservations || userReservations.length === 0) {
        setReservations([]);
        return;
      }

      setReservations(userReservations);
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles reservation cancellation and updates the UI accordingly.
   * @param eventId - The associated event ID.
   * @param reservationId - The reservation to be cancelled.
   */
  const handleCancelReservation = async (eventId: string, reservationId: string) => {
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this reservation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await deleteReservation(eventId, reservationId);
              setReservations((prev) => prev.filter((r) => r.id !== reservationId));
              Toast.show({
                type: 'success',
                text1: 'Reservation Cancelled',
                text2: 'Your reservation has been successfully cancelled.',
              });
            } catch (error: any) {
              console.error('Error canceling reservation:', error);
              Alert.alert('Error', 'Failed to cancel reservation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleExpand = (reservationId: string) => {
    setExpandedReservation((prev) => (prev === reservationId ? null : reservationId));
  };

  /**
   * Renders a reservation card.
   */
  const renderReservation = ({ item }: { item: Reservation }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.cardHeader}>
        <Text style={styles.eventName}>{item.eventName || 'Unknown Event'}</Text>
        <Ionicons
          name={expandedReservation === item.id ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
      {expandedReservation === item.id && (
        <View style={styles.reservationDetails}>
          <Text style={styles.detailsText}>
            Date: {item.eventDate || 'N/A'}
          </Text>
          <Text style={styles.detailsText}>Table: {item.tableNumber || 'N/A'}</Text>
          <Text style={styles.detailsText}>Guests: {item.guestCount || 'N/A'}</Text>
          <Text style={styles.detailsText}>
            Bottles: {item.bottles?.map((b) => b.name).join(', ') || 'N/A'}
          </Text>
          <Text style={styles.detailsText}>
            Mixers: {item.mixers?.map((m) => m.name).join(', ') || 'N/A'}
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelReservation(item.eventId, item.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (error || reservations.length === 0) {
    return (
      <View style={styles.noReservationsContainer}>
        <Text style={styles.noReservationsText}>
          {error
            ? 'Unable to load reservations. Please try again.'
            : 'You have no reservations yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  noReservationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Match the app's dark theme
  },
  noReservationsText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1c1c1c',
    marginBottom: 15,
    borderRadius: 8,
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  reservationDetails: {
    marginTop: 10,
  },
  detailsText: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 5,
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ReservationsScreen;