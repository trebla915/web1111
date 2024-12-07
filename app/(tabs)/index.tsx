// File: HomeScreen.tsx
// Summary: Displays a welcome message with the user's name and highlights the next upcoming event.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useUser } from "../../src/contexts/UserContext"; // Use UserContext to fetch the user's name
import { fetchAllEvents } from "../../src/utils/events";
import { Event } from "../../src/utils/types";
import { formatToMMDDYYYY } from "../../src/utils/dateFormatter";

const screenWidth = Dimensions.get("window").width;

export const HomeScreen = () => {
  const { userData, isLoading: userLoading } = useUser(); // Fetch userData from UserContext
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Error state for user feedback

  useEffect(() => {
    const getUpcomingEvent = async () => {
      setLoading(true);
      try {
        const events = await fetchAllEvents();

        // Filter and find the next upcoming event
        const now = new Date();
        const nextEvent = events
          .filter((event) => new Date(event.date || "") > now)
          .reduce((soonest, current) =>
            new Date(current.date || "").getTime() < new Date(soonest.date || "").getTime()
              ? current
              : soonest,
            events[0]
          );

        setUpcomingEvent(nextEvent || null);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to fetch upcoming events.");
      } finally {
        setLoading(false);
      }
    };

    getUpcomingEvent();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Club Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@/src/assets/logo.png")}
          style={styles.clubLogo}
        />
      </View>

      {/* Welcome Section */}
      <View style={styles.section}>
        <Text style={styles.welcomeText}>
          Welcome, {userLoading ? "Loading..." : userData?.name || "Guest"}!
        </Text>
        <Text style={styles.subText}>
          Every moment is a chance to align with your purpose.
        </Text>
      </View>

      {/* Upcoming Event Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Event</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : error ? (
          <Text style={styles.noEventText}>{error}</Text>
        ) : upcomingEvent ? (
          <View style={styles.eventCard}>
            <Image
              source={{
                uri: upcomingEvent.flyerUrl || "https://via.placeholder.com/300",
              }}
              style={styles.eventImage}
            />
            <Text style={styles.eventTitle}>{upcomingEvent.title}</Text>
            <Text style={styles.eventDate}>
              {upcomingEvent.date
                ? formatToMMDDYYYY(upcomingEvent.date)
                : "Date not available"}
            </Text>
          </View>
        ) : (
          <Text style={styles.noEventText}>No upcoming events.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  clubLogo: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.3,
    resizeMode: "contain",
  },
  section: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
    marginTop: -5,
  },
  subText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  eventImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: "cover",
  },
  eventTitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 16,
    color: "#aaa",
  },
  noEventText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },
});

export default HomeScreen;
