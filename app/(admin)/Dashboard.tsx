import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import the components for each screen
import CreateEvent from './CreateEvent';
import ManageUsers from './ManageUsers';
import ManageReservations from './ManageReservations';
import AddBottleToCatalog from './AddBottleToCatalog';
import AddBottlesToEvent from './AddBottlesToEvent';
import EditEvents from './EditEvents'; 
import PushNotifications from './PushNotifications'; // Ensure correct import

// Create the Top Tab Navigator
const Tab = createMaterialTopTabNavigator();

export default function Dashboard() {
  console.log('Dashboard rendered');
  console.log('CreateEvent component:', CreateEvent);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true, // Enables horizontal scrolling for tabs
        tabBarStyle: {
          backgroundColor: '#1c1c1c', // Dark background for the tab bar
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#fff', // White underline for the active tab
        },
        tabBarLabelStyle: {
          color: '#fff', // White text for labels
          fontSize: 14,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="CreateEvent" 
        component={CreateEvent}
        options={{
          title: 'Create Event',
          tabBarLabel: 'Create Event'
        }}
      />
      <Tab.Screen 
        name="EditEvents" 
        component={EditEvents}
        options={{
          title: 'Edit Events',
          tabBarLabel: 'Edit Events'
        }}
      />
      <Tab.Screen name="ManageUsers" component={ManageUsers} />
      <Tab.Screen name="ManageReservations" component={ManageReservations} />
      <Tab.Screen name="AddBottleToCatalog" component={AddBottleToCatalog} />
      <Tab.Screen name="AddBottlesToEvent" component={AddBottlesToEvent} />
      <Tab.Screen name="PushNotifications" component={PushNotifications} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
