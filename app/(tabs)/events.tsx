import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Alert,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAllEvents } from '../../src/utils/events';
import { Event } from '../../src/utils/types';
import { Linking } from 'react-native';
import { useLoading } from '../../src/contexts/LoadingContext'; // Use global loading context
import Icon from 'react-native-vector-icons/Ionicons';
import { Pressable } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext'; // Import Auth context
import * as Updates from 'expo-updates';
import { formatDate } from '../../src/utils/dateFormatter';

const EventsScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search query
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]); // State for filtered events

  const { setLoading } = useLoading(); // Use global loading context
  const { isGuest } = useAuth(); // Access guest mode
  const router = useRouter();

  // Check for updates
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update Available',
            'A new update has been downloaded. Restart the app to apply the changes.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Restart',
                onPress: async () => {
                  await Updates.reloadAsync();
                },
              },
            ]
          );
        }
      } catch (error) {
        // Handle error but don't alert the user
        console.log('Error checking for updates:', error);
      }
    }
    checkForUpdates();
  }, []);

  // Fetch and sort events by date
  const fetchEvents = useCallback(async () => {
    setLoading(true); // Show global loader
    try {
      const fetchedEvents = await fetchAllEvents();

      // Sort events by date (earliest first) and avoid mutating state directly
      const sortedEvents = [...fetchedEvents].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateA - dateB; // Ascending order
      });

      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents); // Set filtered events to match sorted events
    } catch (err: any) {
      console.error('Error fetching events:', err.message || err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false); // Hide global loader
      setRefreshing(false);
    }
  }, [setLoading]);

  useEffect(() => {
    // Fetch events on component mount
    if (events.length === 0) {
      fetchEvents();
    }
  }, [fetchEvents, events]);

  // Handle search query for events
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredEvents(events); // Show all events if search query is empty
    } else {
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.date?.toLowerCase().includes(query.toLowerCase()) // Match with event title or date
      );
      setFilteredEvents(filtered);
    }
  };

  // Handle table reservation button press
  const handleTablePress = (event: Event) => {
    if (!event || !event.id) {
      Alert.alert('Error', 'Event details are missing. Please try again.');
      return;
    }

    console.log('Event reservations status:', {
      eventId: event.id,
      eventTitle: event.title,
      reservationsEnabled: event.reservationsEnabled
    });

    if (!event.reservationsEnabled) {
      Alert.alert(
        'Reservations Disabled',
        'Table reservations are not available for this event.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    if (isGuest) {
      Alert.alert(
        'Account Required',
        'You need an account to reserve a table.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/(auth)/Register') },
        ]
      );
      return;
    }

    router.push({
      pathname: '/(reservations)/TableSelection',
      params: { eventId: event.id, eventTitle: event.title, eventDate: event.date },
    });
  };

  // Handle ticket purchase link press
  const handleTicketPress = async (ticketLink?: string) => {
    setLoading(true); // Show global loader
    try {
      if (ticketLink) {
        await Linking.openURL(ticketLink);
      } else {
        Alert.alert('No Ticket Link', 'This event does not have a ticket link.');
      }
    } catch (err) {
      console.error('Error opening ticket link:', err);
      Alert.alert('Error', 'Failed to open the ticket link.');
    } finally {
      setLoading(false); // Hide global loader
    }
  };

  // Render each event card
  const renderEventCard = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.flyerUrl || 'https://via.placeholder.com/150' }}
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.date && (
          <Text style={styles.dateText}>
            Date: {formatDate(item.date)}
          </Text>
        )}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.reserveButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleTablePress(item)}
          >
            <Text style={styles.buttonText}>Reserve Table</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.ticketButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleTicketPress(item.ticketLink)}
          >
            <Text style={styles.buttonText}>Tickets</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#ccc" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#ccc"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredEvents} // Use filtered events for display
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEvents} />}
          initialNumToRender={10} // Optimize FlatList rendering
          windowSize={5} // Control how many screens worth of content is kept in memory
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  list: {
    paddingVertical: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    marginVertical: 8,
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    margin: 10,
  },
  infoContainer: {
    flex: 1,
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dateText: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  reserveButton: {
    backgroundColor: '#007BFF',
  },
  ticketButton: {
    backgroundColor: '#28A745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  searchIcon: {
    marginRight: 8, // Add spacing between the icon and the text input
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
  },
});

export default EventsScreen;