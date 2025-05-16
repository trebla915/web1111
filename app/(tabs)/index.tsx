// File: HomeScreen.tsx
// Summary: Displays a welcome message with the user's name and highlights the next upcoming event.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useUser } from "../../src/contexts/UserContext"; // Use UserContext to fetch the user's name
import { fetchAllEvents } from "../../src/utils/events";
import { Event } from "../../src/utils/types";
import { formatDate, toMountainTime } from '../../src/utils/dateFormatter';

const HomeScreen = () => {
  const { userData, isLoading: userLoading } = useUser(); // Fetch userData from UserContext
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Error state for user feedback
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const events = await fetchAllEvents();
      const now = toMountainTime(new Date());

      const nextEvent = events
        .filter((event) => {
          if (!event.date) return false;
          const eventDate = toMountainTime(event.date);
          return eventDate > now;
        })
        .reduce((soonest, current) => {
          if (!current.date || !soonest.date) return soonest;
          const currentDate = toMountainTime(current.date);
          const soonestDate = toMountainTime(soonest.date);
          return currentDate < soonestDate ? current : soonest;
        }, events[0]);

      setUpcomingEvent(nextEvent || null);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to fetch upcoming events.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <ScrollView 
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Welcome, {userLoading ? "Loading..." : userData?.name || "Guest"}!
        </Text>
        <Text style={styles.welcomeSubtext}>
          Every moment is a chance to align with your purpose.
        </Text>
      </View>

      {/* Upcoming Event Section */}
      <View style={styles.eventSection}>
        <Text style={styles.sectionTitle}>
          Upcoming Event
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : upcomingEvent ? (
          <View style={styles.eventCard}>
            <Image
              source={{ uri: upcomingEvent.flyerUrl || 'https://via.placeholder.com/150' }}
              style={styles.eventImage}
              resizeMode="cover"
            />
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>
                {upcomingEvent.title}
              </Text>
              {upcomingEvent.date && (
                <Text style={styles.eventDate}>
                  {formatDate(upcomingEvent.date)}
                </Text>
              )}
              {upcomingEvent.ticketLink && (
                <TouchableOpacity
                  style={styles.ticketButton}
                  onPress={() => Linking.openURL(upcomingEvent.ticketLink!)}
                >
                  <Text style={styles.buttonText}>
                    Get Tickets
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>
              No upcoming events.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#000',
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eventSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 256,
  },
  eventDetails: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  ticketButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  noEventsContainer: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsText: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
});

export default HomeScreen;
