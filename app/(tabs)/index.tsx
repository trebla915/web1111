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
} from "react-native";
import { useUser } from "../../src/contexts/UserContext"; // Use UserContext to fetch the user's name
import { fetchAllEvents } from "../../src/utils/events";
import { Event } from "../../src/utils/types";
import { formatDate, toMountainTime } from '../../src/utils/dateFormatter';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

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
    <StyledScrollView 
      className="flex-1 bg-black"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      {/* Welcome Section */}
      <StyledView className="px-6 py-4">
        <StyledText className="text-2xl font-bold text-white text-center mb-1">
          Welcome, {userLoading ? "Loading..." : userData?.name || "Guest"}!
        </StyledText>
        <StyledText className="text-sm text-gray-400 text-center italic">
          Every moment is a chance to align with your purpose.
        </StyledText>
      </StyledView>

      {/* Upcoming Event Section */}
      <StyledView className="px-6">
        <StyledText className="text-xl font-bold text-white mb-3">
          Upcoming Event
        </StyledText>
        
        {loading ? (
          <StyledView className="items-center justify-center py-4">
            <ActivityIndicator size="large" color="#fff" />
          </StyledView>
        ) : error ? (
          <StyledText className="text-base text-gray-400 text-center">
            {error}
          </StyledText>
        ) : upcomingEvent ? (
          <StyledView className="bg-gray-900 rounded-xl overflow-hidden">
            <StyledImage
              source={{ uri: upcomingEvent.flyerUrl || 'https://via.placeholder.com/150' }}
              className="w-full h-64"
              resizeMode="cover"
            />
            <StyledView className="p-4">
              <StyledText className="text-xl font-bold text-white mb-2">
                {upcomingEvent.title}
              </StyledText>
              {upcomingEvent.date && (
                <StyledText className="text-sm text-gray-300 mb-4">
                  {formatDate(upcomingEvent.date)}
                </StyledText>
              )}
              {upcomingEvent.ticketLink && (
                <StyledTouchableOpacity
                  className="bg-blue-600 py-3 px-6 rounded-lg items-center"
                  onPress={() => Linking.openURL(upcomingEvent.ticketLink!)}
                >
                  <StyledText className="text-white font-semibold text-base">
                    Get Tickets
                  </StyledText>
                </StyledTouchableOpacity>
              )}
            </StyledView>
          </StyledView>
        ) : (
          <StyledView className="bg-gray-900 rounded-xl p-4 items-center justify-center">
            <StyledText className="text-base text-gray-400 text-center">
              No upcoming events.
            </StyledText>
          </StyledView>
        )}
      </StyledView>
    </StyledScrollView>
  );
};

export default HomeScreen;
