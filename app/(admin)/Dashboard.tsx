import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

const actions = [
  {
    label: 'Create Event',
    icon: <MaterialIcons name="event" size={32} color="#fff" />,
    route: 'CreateEvent',
  },
  {
    label: 'Edit Events',
    icon: <MaterialIcons name="edit" size={32} color="#fff" />,
    route: 'EditEvents',
  },
  {
    label: 'Manage Reservations',
    icon: <Ionicons name="calendar" size={32} color="#fff" />,
    route: 'ManageReservations',
  },
  {
    label: 'Manage Users',
    icon: <Ionicons name="people" size={32} color="#fff" />,
    route: 'ManageUsers',
  },
  {
    label: 'Add Bottles',
    icon: <FontAwesome5 name="wine-bottle" size={32} color="#fff" />,
    route: 'AddBottlesToEvent',
  },
  {
    label: 'Push Notifications',
    icon: <Ionicons name="notifications" size={32} color="#fff" />,
    route: 'PushNotifications',
  },
];

const numColumns = 2;
const cardWidth = (Dimensions.get('window').width - 60) / numColumns;

const AdminDashboard = () => {
  const router = useRouter();

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(admin)/${item.route}`)}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>{item.icon}</View>
      <Text style={styles.cardLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={actions}
        renderItem={renderItem}
        keyExtractor={item => item.label}
        numColumns={numColumns}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    width: cardWidth,
    height: 140,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 12,
  },
  cardLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AdminDashboard;
