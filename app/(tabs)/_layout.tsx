// app/(tabs)/_layout.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, Stack, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

const TabLayout = () => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopColor: 'gray',
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#000',
            borderBottomWidth: 1,
            borderBottomColor: 'gray',
          },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity style={styles.headerIconContainer}>
              <Ionicons name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Upcoming Events',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: 'Community',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
};

const styles = StyleSheet.create({
  headerIconContainer: {
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TabLayout;