import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { fetchAllEvents, updateEvent, deleteEvent } from '../../src/utils/events';
import { Event } from '../../src/utils/types';
import CustomButton from '../../src/components/CustomButton';
import { Ionicons } from '@expo/vector-icons'; // Import the icon library

const EditEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]); // For filtered events
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [ticketLink, setTicketLink] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [reservationsEnabled, setReservationsEnabled] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const fetchedEvents = await fetchAllEvents();
      setEvents(fetchedEvents);
      setFilteredEvents(fetchedEvents); // Initialize filtered events
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredEvents(events); // Show all events if search is empty
    } else {
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  const handleEventSelection = (eventId: string) => {
    const selectedEvent = events.find((event) => event.id === eventId);
    if (selectedEvent) {
      console.log('Selected event:', {
        id: selectedEvent.id,
        title: selectedEvent.title,
        reservationsEnabled: selectedEvent.reservationsEnabled
      });
      setSelectedEventId(eventId);
      setEventTitle(selectedEvent.title || '');
      setEventDate(selectedEvent.date || '');
      setTicketLink(selectedEvent.ticketLink || '');
      setReservationsEnabled(selectedEvent.reservationsEnabled ?? true);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEventId) {
      Alert.alert('Error', 'No event selected.');
      return;
    }

    setLoading(true);
    try {
      const updatedEvent = {
        title: eventTitle,
        date: eventDate,
        ticketLink,
        reservationsEnabled,
      };
      console.log('Updating event:', {
        eventId: selectedEventId,
        ...updatedEvent
      });
      const response = await updateEvent(selectedEventId, updatedEvent);
      console.log('Update response:', response);
      Alert.alert('Success', 'Event updated successfully.');
      loadEvents(); // Reload events to reflect updates
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventId) {
      Alert.alert('Error', 'No event selected.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteEvent(selectedEventId);
              Alert.alert('Success', 'Event deleted successfully.');
              setSelectedEventId(null);
              setEventTitle('');
              setEventDate('');
              setTicketLink('');
              loadEvents(); // Reload events to reflect updates
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#ccc" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          <Text style={styles.label}>Select Event:</Text>
          <ScrollView
            style={styles.dropdown}
            contentContainerStyle={styles.dropdownContent}
            persistentScrollbar={true} // Keeps the scrollbar visible on Android
            scrollIndicatorInsets={{ right: 1 }} // Positions the scrollbar closer
          >
            {filteredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.dropdownItem,
                  selectedEventId === event.id && styles.selectedItem,
                ]}
                onPress={() => handleEventSelection(event.id)}
              >
                <Text style={styles.dropdownText}>{event.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedEventId && (
            <>
              <Text style={styles.label}>Event Title:</Text>
              <TextInput
                style={styles.input}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Enter Event Title"
                placeholderTextColor="#888"
              />

              <Text style={styles.label}>Event Date:</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#888"
                value={eventDate}
                onChangeText={setEventDate}
              />

              <Text style={styles.label}>Ticket Link:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Ticket Link"
                placeholderTextColor="#888"
                value={ticketLink}
                onChangeText={setTicketLink}
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Enable Reservations</Text>
                <Switch
                  value={reservationsEnabled}
                  onValueChange={setReservationsEnabled}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={reservationsEnabled ? '#6200ea' : '#f4f3f4'}
                />
              </View>

              <View style={styles.buttonContainer}>
                <View style={styles.buttonWrapper}>
                  <CustomButton title="Update Event" onPress={handleUpdateEvent} />
                </View>
                <View style={styles.buttonWrapper}>
                  <CustomButton title="Delete Event" onPress={handleDeleteEvent} outlined />
                </View>
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#121212', // Dark background
  },
  label: {
    fontSize: 16,
    color: '#ffffff',
    marginVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#ffffff',
    fontSize: 16,
  },
  input: {
    height: 50,
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1c1c1c',
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  dropdown: {
    maxHeight: 200,
    marginBottom: 16,
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownContent: {
    paddingVertical: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dropdownText: {
    fontSize: 16,
    color: '#ffffff',
  },
  selectedItem: {
    backgroundColor: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
});

export default EditEvents;