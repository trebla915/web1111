import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'; // Import icons
import { useRouter } from 'expo-router';
import { fetchReservationsGroupedByEvent } from '../../src/utils/reservations'; 
import { fetchAllEvents } from '../../src/utils/events';
import CustomButton from '../../src/components/CustomButton';
import { Reservation as ReservationType, Event } from '../../src/utils/types';

type Reservation = ReservationType;

type ReservationsByEvent = {
  [eventTitle: string]: Reservation[];
};

const ManageReservations = () => {
  const [reservationsByEvent, setReservationsByEvent] = useState<ReservationsByEvent>({});
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const reservationsData = await fetchReservationsGroupedByEvent();
        if (!reservationsData || typeof reservationsData !== 'object' || Array.isArray(reservationsData)) {
          throw new Error('Invalid reservations data format');
        }

        const events = await fetchAllEvents();
        const eventTitleMap: { [key: string]: string } = {};
        events.forEach((event: Event) => {
          eventTitleMap[event.id] = event.title;
        });

        const reservationsByEventTitle: ReservationsByEvent = {};
        for (const [eventId, reservations] of Object.entries(reservationsData)) {
          if (!Array.isArray(reservations)) {
            console.warn(`Invalid reservations array for eventId: ${eventId}`);
            continue;
          }

          const eventTitle = eventTitleMap[eventId] || eventId;
          reservationsByEventTitle[eventTitle] = reservations.map((reservation) => ({
            ...reservation,
            tableNumber: reservation.tableNumber ?? 0,
          }));
        }

        setReservationsByEvent(reservationsByEventTitle);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching reservations:', err.message || err);
        setError('Failed to load reservations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const toggleEventExpand = (eventTitle: string) => {
    setExpandedEventId(expandedEventId === eventTitle ? null : eventTitle);
  };

  const noReservations = Object.keys(reservationsByEvent).length === 0;

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={styles.loadingIndicator} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : noReservations ? (
        <Text style={styles.noReservationsYetText}>No reservations yet</Text>
      ) : (
        <ScrollView>
          {Object.entries(reservationsByEvent).map(([eventTitle, reservations]) => (
            <View key={eventTitle} style={styles.eventContainer}>
              <CustomButton
                title={eventTitle}
                onPress={() => toggleEventExpand(eventTitle)}
                outlined={true}
              />
              {expandedEventId === eventTitle && (
                <View style={styles.reservationsList}>
                  {reservations.length === 0 ? (
                    <Text style={styles.noReservationsText}>
                      No reservations found for this event.
                    </Text>
                  ) : (
                    reservations.map((reservation) => (
                      <View key={reservation.id} style={styles.reservationItem}>
                        <View style={styles.row}>
                          <MaterialCommunityIcons name="table-furniture" size={20} color="#fff" />
                          <Text style={styles.iconText}>Table: {reservation.tableNumber}</Text>
                        </View>
                        <View style={styles.row}>
                          <FontAwesome5 name="user" size={18} color="#fff" />
                          <Text style={styles.iconText}>User: {reservation.userId}</Text>
                        </View>
                        <View style={styles.row}>
                          <FontAwesome5 name="users" size={18} color="#fff" />
                          <Text style={styles.iconText}>Guests: {reservation.guestCount}</Text>
                        </View>
                        {reservation.bottles?.length ? (
  <View style={styles.row}>
    <MaterialCommunityIcons name="bottle-wine" size={20} color="#fff" />
    <Text style={styles.iconText}>
      Bottles: {reservation.bottles.map((b) => b.name).join(', ')}
    </Text>
  </View>
) : (
  <Text style={styles.noReservationsText}>No bottles reserved.</Text>
)}
                        
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  eventContainer: {
    marginBottom: 15,
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  reservationsList: {
    padding: 10,
    backgroundColor: '#1c1c1c',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  reservationItem: {
    paddingVertical: 10,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  noReservationsText: {
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  noReservationsYetText: {
    color: '#bbb',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});

export default ManageReservations;