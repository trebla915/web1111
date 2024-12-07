import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { fetchAllBottlesFromCatalog } from 'src/utils/catalog';
import { fetchAllBottlesForEvent, addBottlesToEvent, deleteBottleFromEvent } from 'src/utils/bottleService';
import { fetchAllEvents } from 'src/utils/events';
import { BottleCatalog, MergedBottle, Event } from "../../src/utils/types";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AddBottlesToEvent() {
  const [catalogBottles, setCatalogBottles] = useState<BottleCatalog[]>([]);
  const [mergedBottles, setMergedBottles] = useState<MergedBottle[]>([]);
  const [filteredBottles, setFilteredBottles] = useState<MergedBottle[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [loadingType, setLoadingType] = useState<"fetching" | "saving" | null>(
    null
  );

  // Modal-specific state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentBottle, setCurrentBottle] = useState<MergedBottle | null>(null);
  const [modalPrice, setModalPrice] = useState<string>("");

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoadingType("fetching");
        const fetchedCatalog = await fetchAllBottlesFromCatalog();
        setCatalogBottles(fetchedCatalog);

        const fetchedEvents = await fetchAllEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error initializing data:", error);
        Alert.alert("Error", "Failed to load initial data.");
      } finally {
        setLoadingType(null);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAndMergeEventBottles(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredBottles(mergedBottles);
    } else {
      setFilteredBottles(
        mergedBottles.filter((bottle) =>
          bottle.name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, mergedBottles]);

  const fetchAndMergeEventBottles = async (eventId: string) => {
    try {
      setLoadingType("fetching");
      const eventBottles = await fetchAllBottlesForEvent(eventId);

      const combinedBottles = catalogBottles.map((catalogBottle) => {
        const matchingEventBottle = eventBottles.find(
          (eventBottle) => eventBottle.id === catalogBottle.id
        );

        return {
          ...catalogBottle,
          isInEvent: !!matchingEventBottle,
          eventData: matchingEventBottle || undefined,
        };
      });

      setMergedBottles(combinedBottles);
      setFilteredBottles(combinedBottles);
    } catch (error) {
      console.error("Error fetching event bottles:", error);
      Alert.alert("Error", "Failed to load bottles for the selected event.");
    } finally {
      setLoadingType(null);
    }
  };

  const handleAddOrEditBottle = (bottle: MergedBottle) => {
    setCurrentBottle(bottle);
    setModalPrice(bottle.eventData?.price?.toString() || "");
    setIsModalVisible(true);
  };

  const handleDeleteBottleFromEvent = async () => {
    if (!currentBottle || !selectedEventId) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove ${currentBottle.name} from this event?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: async () => {
            try {
              setLoadingType("saving");
              await deleteBottleFromEvent(selectedEventId, currentBottle.id);
              Alert.alert("Success", `${currentBottle.name} removed from event!`);
              setIsModalVisible(false);
              await fetchAndMergeEventBottles(selectedEventId);
            } catch (error) {
              console.error("Error removing bottle from event:", error);
              Alert.alert(
                "Error",
                `Failed to remove ${currentBottle.name} from event.`
              );
            } finally {
              setLoadingType(null);
            }
          },
        },
      ]
    );
  };

  const handleUpdateBottlePrice = async () => {
    if (!currentBottle || !selectedEventId || !modalPrice) {
      Alert.alert("Error", "Please fill in the price.");
      return;
    }

    if (isNaN(parseFloat(modalPrice))) {
      Alert.alert("Error", "Price must be a valid number.");
      return;
    }

    const updatedBottle = {
      id: currentBottle.id,
      name: currentBottle.name,
      price: parseFloat(modalPrice),
      eventId: selectedEventId,
    };

    try {
      setLoadingType("saving");
      await addBottlesToEvent(selectedEventId, [updatedBottle]);
      Alert.alert("Success", "Bottle price updated!");
      setIsModalVisible(false);
      await fetchAndMergeEventBottles(selectedEventId);
    } catch (error) {
      console.error("Error updating bottle price:", error);
      Alert.alert("Error", "Failed to update the bottle price.");
    } finally {
      setLoadingType(null);
    }
  };

  const renderBottleItem = ({ item }: { item: MergedBottle }) => (
    <TouchableOpacity
      style={styles.bottleCard}
      onPress={() => handleAddOrEditBottle(item)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.bottleImage}
        resizeMode="contain"
      />
      <Text style={styles.bottleName}>{item.name}</Text>
      <View style={styles.iconContainer}>
        {item.isInEvent ? (
          <MaterialCommunityIcons name="check-circle" size={20} color="green" />
        ) : (
          <MaterialIcons name="add-circle-outline" size={20} color="#fff" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loadingType && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      <DropDownPicker
        open={eventDropdownOpen}
        value={selectedEventId}
        items={events.map((event) => ({ label: event.title, value: event.id }))}
        setOpen={setEventDropdownOpen}
        setValue={(value) => setSelectedEventId(value ?? null)}
        placeholder="Select an Event"
      />
      {selectedEventId && (
        <TextInput
          placeholder="Search bottles..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          placeholderTextColor="#aaa"
        />
      )}
      <FlatList
        data={filteredBottles}
        keyExtractor={(item) => item.id}
        renderItem={renderBottleItem}
        ListEmptyComponent={
          <Text style={styles.noBottlesText}>No bottles match your search.</Text>
        }
      />
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeIcon}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{currentBottle?.name}</Text>
            <TextInput
              placeholder="Enter Price"
              value={modalPrice}
              onChangeText={setModalPrice}
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateBottlePrice}
            >
              <Text style={styles.buttonText}>Update Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteBottleFromEvent}
            >
              <Text style={styles.buttonText}>Remove from Event</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  bottleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101010",
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#fff",
  },
  bottleImage: { width: 50, height: 50, marginRight: 15 },
  bottleName: { color: "#fff", fontSize: 16, fontWeight: "bold", flex: 1 },
  iconContainer: { justifyContent: "center", alignItems: "center" },
  noBottlesText: { color: "#ccc", textAlign: "center", marginTop: 20 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    backgroundColor: "#202020",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    width: "100%",
    backgroundColor: "#303030",
    color: "#fff",
  },
  searchInput: {
    backgroundColor: "#303030",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#555",
  },
  saveButton: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  deleteButton: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  closeIcon: { position: "absolute", top: 10, right: 10 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});