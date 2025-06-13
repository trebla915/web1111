import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchAllBottlesForEvent } from '../../src/utils/bottleService'; // Correct import
import { Bottle, BackendBottle } from '../../src/utils/types';
import { useUser } from '../../src/contexts/UserContext';
import { MaterialIcons } from '@expo/vector-icons';

const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/150';

const BottleSelectionModal: React.FC = () => {
  const router = useRouter();
  const { updateReservationDetails, reservationDetails } = useUser();
  const { eventId } = useLocalSearchParams();

  const [bottles, setBottles] = useState<Bottle[]>([]); // All bottles for the event
  const [selectedBottles, setSelectedBottles] = useState<{ [id: string]: { bottle: Bottle; quantity: number } }>(
    () => {
      const initial: { [id: string]: { bottle: Bottle; quantity: number } } = {};
      (reservationDetails?.bottles || []).forEach((bottle) => {
        if (initial[bottle.id]) {
          initial[bottle.id].quantity += 1;
        } else {
          initial[bottle.id] = { bottle, quantity: 1 };
        }
      });
      return initial;
    }
  );
  const [loading, setLoading] = useState<boolean>(true);

  const bottleMinimum = reservationDetails?.bottleMinimum ?? 1;
  const totalSelected = Object.values(selectedBottles).reduce((sum, { quantity }) => sum + quantity, 0);
  const minimumMet = totalSelected >= bottleMinimum;

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

  // Increment bottle quantity
  const incrementBottle = (bottle: Bottle) => {
    setSelectedBottles((prev) => {
      const next = { ...prev };
      if (next[bottle.id]) {
        next[bottle.id].quantity += 1;
      } else {
        next[bottle.id] = { bottle, quantity: 1 };
      }
      return next;
    });
  };

  // Decrement bottle quantity
  const decrementBottle = (bottle: Bottle) => {
    setSelectedBottles((prev) => {
      const next = { ...prev };
      if (next[bottle.id]) {
        if (next[bottle.id].quantity > 1) {
          next[bottle.id].quantity -= 1;
        } else {
          delete next[bottle.id];
        }
      }
      return next;
    });
  };

  // Confirm the selected bottles and update reservation details
  const handleConfirmSelection = () => {
    // Expand to flat array of bottles
    const bottlesArray: Bottle[] = [];
    Object.values(selectedBottles).forEach(({ bottle, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        bottlesArray.push(bottle);
      }
    });
    updateReservationDetails({
      ...reservationDetails,
      bottles: bottlesArray,
    });
    router.back();
  };

  // Render each bottle item
  const renderItem = (item: Bottle) => {
    const selected = selectedBottles[item.id]?.quantity || 0;
    return (
      <View style={styles.item}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="contain"
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity onPress={() => decrementBottle(item)} style={styles.quantityButton}>
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{selected}</Text>
          <TouchableOpacity onPress={() => incrementBottle(item)} style={styles.quantityButton}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
                      {MaterialIcons ? <MaterialIcons name="close" size={28} color="#fff" /> : <Text style={{color:'#fff',fontSize:24}}>×</Text>}
        </TouchableOpacity>
        <Text style={styles.title}>Select Bottles</Text>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.headerIconButton}>
                      {MaterialIcons ? <MaterialIcons name="home" size={28} color="#fff" /> : <Text style={{color:'#fff',fontSize:24}}>🏠</Text>}
        </TouchableOpacity>
      </View>
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
      {!minimumMet && (
        <Text style={styles.warningText}>
          You must select at least {bottleMinimum} bottle{bottleMinimum > 1 ? 's' : ''} to continue.
        </Text>
      )}
      <TouchableOpacity style={[styles.confirmButton, { backgroundColor: minimumMet ? '#fff' : '#666' }]} onPress={handleConfirmSelection} disabled={!minimumMet}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerIconButton: {
    padding: 4,
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
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  quantityButton: {
    backgroundColor: '#333',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 6,
    minWidth: 18,
    textAlign: 'center',
  },
  warningText: {
    color: 'orange',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
});

export default BottleSelectionModal;
