// File: HomeScreen.tsx
// Summary: Displays a welcome message with the user's name and highlights the next upcoming event.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Linking,
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

        // Get current date in Mountain Time
        const now = toMountainTime(new Date());

        // Filter and find the next upcoming event
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

    getUpcomingEvent();
  }, []);

  return (
    <StyledScrollView className="flex-1 bg-black">
      {/* Hero Section with Logo */}
      <StyledView className="items-center justify-center py-8 px-4">
        <StyledImage
          source={require("@/src/assets/logo.png")}
          className="w-4/5 h-24"
          resizeMode="contain"
        />
      </StyledView>

      {/* Welcome Section */}
      <StyledView className="px-6 py-4 mb-6">
        <StyledText className="text-3xl font-bold text-white text-center mb-2">
          Welcome, {userLoading ? "Loading..." : userData?.name || "Guest"}!
        </StyledText>
        <StyledText className="text-base text-gray-400 text-center italic">
          Every moment is a chance to align with your purpose.
        </StyledText>
      </StyledView>

      {/* Upcoming Event Section */}
      <StyledView className="px-6 mb-8">
        <StyledText className="text-xl font-bold text-white mb-4">
          Upcoming Event
        </StyledText>
        
        {loading ? (
          <StyledView className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#fff" />
          </StyledView>
        ) : error ? (
          <StyledText className="text-base text-gray-400 text-center">
            {error}
          </StyledText>
        ) : upcomingEvent ? (
          <StyledView className="bg-[#1c1c1c] rounded-xl overflow-hidden">
            <StyledImage
              source={{ uri: upcomingEvent.flyerUrl || 'https://via.placeholder.com/150' }}
              className="w-full h-80 rounded-t-xl"
              resizeMode="cover"
            />
            <StyledView className="p-4">
              <StyledText className="text-xl font-bold text-white mb-2">
                {upcomingEvent.title}
              </StyledText>
              {upcomingEvent.date && (
                <StyledText className="text-base text-gray-400 mb-4">
                  {formatDate(upcomingEvent.date)}
                </StyledText>
              )}
              {upcomingEvent.ticketLink && (
                <StyledText
                  className="text-base text-gray-400 text-center underline"
                  onPress={() => Linking.openURL(upcomingEvent.ticketLink!)}
                >
                  Get Tickets
                </StyledText>
              )}
            </StyledView>
          </StyledView>
        ) : (
          <StyledText className="text-base text-gray-400 text-center">
            No upcoming events.
          </StyledText>
        )}
      </StyledView>
    </StyledScrollView>
  );
};

export default HomeScreen;
