import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchAllBottlesForEvent } from '../../src/utils/bottleService'; // Correct import
import { Bottle, BackendBottle } from '../../src/utils/types';
import { useUser } from '../../src/contexts/UserContext';

const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/150';

const BottleSelectionModal: React.FC = () => {
  const router = useRouter();
  const { updateReservationDetails, reservationDetails } = useUser();
  const { eventId } = useLocalSearchParams();

  const [bottles, setBottles] = useState<Bottle[]>([]); // All bottles for the event
  const [selectedBottles, setSelectedBottles] = useState<Bottle[]>(
    reservationDetails?.bottles || [] // Pre-select bottles from reservation details
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID is missing.');
      router.back();
      return;
    }
    fetchBottles(); // Fetch bottles on component mount
  }, [eventId]);

  // Fetch all bottles available for the event
  const fetchBottles = async () => {
    try {
      setLoading(true);
      const fetchedBottles = await fetchAllBottlesForEvent(eventId as string);
      const formattedBottles: Bottle[] = fetchedBottles.map((bottle: BackendBottle) => ({
        id: bottle.id,
        name: bottle.name,
        price: bottle.price || 0, // Default price if missing
        imageUrl: bottle.imageUrl || PLACEHOLDER_IMAGE_URL, // Default image if missing
      }));
      setBottles(formattedBottles); // Update state with fetched bottles
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bottles for this event.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle bottle selection
  const toggleBottleSelection = (bottle: Bottle) => {
    setSelectedBottles((prev) =>
      prev.find((selected) => selected.id === bottle.id)
        ? prev.filter((selected) => selected.id !== bottle.id) // Remove if already selected
        : [...prev, bottle] // Add if not selected
    );
  };

  // Confirm the selected bottles and update reservation details
  const handleConfirmSelection = () => {
    updateReservationDetails({
      ...reservationDetails,
      bottles: selectedBottles, // Pass selected bottles to reservation details
    });
    router.back(); // Navigate back
  };

  // Render each bottle item
  const renderItem = (item: Bottle) => {
    const isSelected = selectedBottles.some((bottle) => bottle.id === item.id); // Check if selected

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => toggleBottleSelection(item)} // Toggle selection on press
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="contain"
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        {isSelected && <Text style={styles.selectedText}>Selected</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Bottles</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading bottles...</Text>
      ) : (
        <FlatList
          data={bottles} // Display bottles fetched
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderItem(item)}
          ListEmptyComponent={<Text style={styles.emptyText}>No bottles available</Text>}
        />
      )}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSelection}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedItem: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#fff',
  },
  itemPrice: {
    fontSize: 14,
    color: '#aaa',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#aaa',
    textAlign: 'center',
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default BottleSelectionModal;
