import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const UserLayout: React.FC = () => {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000', // Matches the app's dark theme
        },
        headerTintColor: '#fff', // Sets header text and icon color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackground: () => (
          <View style={styles.headerBackground} /> // Add border using a custom background
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/account')} // Navigate to the account page
            style={styles.headerIconContainer}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')} // Navigate to the home screen
            style={styles.headerIconContainer}
          >
            <Ionicons name="home" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    />
  );
};

const styles = StyleSheet.create({
  headerBackground: {
    flex: 1,
    backgroundColor: '#000', // Matches the header background
    borderBottomWidth: 1, // Adds the bottom border
    borderBottomColor: 'gray', // Border color
  },
  headerIconContainer: {
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserLayout;