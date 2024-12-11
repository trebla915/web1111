import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import { BottleProvider } from '../../src/contexts/BottleContext';
import { View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function AdminLayout() {
  const { firebaseUser, isLoading } = useAuth(); // Access user authentication state
  const router = useRouter();

  // Show a loading indicator while checking the authentication status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  return (
    <BottleProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000', // Make header black
          },
          headerTintColor: '#ffffff', // Set the text color to white for contrast
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.replace('/')}
              style={styles.iconButton}
            >
              <MaterialIcons name="home" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      >
        {/* Existing screens */}
        <Stack.Screen name="Dashboard" options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="CreateEvent" options={{ title: 'Create Event' }} />
        <Stack.Screen name="EditEvents" options={{ title: 'Edit Events' }} />
        <Stack.Screen name="CreateReservations" options={{ title: 'Create Reservations' }} />
        <Stack.Screen name="ManageReservations" options={{ title: 'Manage Reservations' }} />
        <Stack.Screen name="ManageUsers" options={{ title: 'Manage Users' }} />
        <Stack.Screen name="AddBottleToCatalog" options={{ title: 'Add Bottle to Catalog' }} />
        <Stack.Screen name="AddBottlesToEvent" options={{ title: 'Add Bottles to Event' }} />
        
        {/* New PushNotification screen */}
        <Stack.Screen 
          name="PushNotification" 
          options={{ title: 'Send Push Notifications' }} 
        />
      </Stack>
    </BottleProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 16,
    padding: 8,
    backgroundColor: '#000', // Match header background
    borderRadius: 50, // Make it circular
  },
});
