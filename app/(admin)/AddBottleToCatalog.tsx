import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  fetchAllBottlesFromCatalog,
  addBottleToCatalog,
  deleteBottleFromCatalog,
  updateBottleInCatalog,
  uploadBottleImage, // Importing from the catalog utility
} from "../../src/utils/catalog";
import { BottleCatalog } from "../../src/utils/types";
import { MaterialIcons } from "@expo/vector-icons";

export default function AddBottleToCatalog() {
  const [catalogBottles, setCatalogBottles] = useState<BottleCatalog[]>([]);
  const [modalName, setModalName] = useState<string>("");
  const [modalPrice, setModalPrice] = useState<string>("");
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentBottle, setCurrentBottle] = useState<BottleCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [newBottleName, setNewBottleName] = useState("");
  const [newBottlePrice, setNewBottlePrice] = useState("");
  const [newBottleImage, setNewBottleImage] = useState<string | null>(null);
  const [imageAdded, setImageAdded] = useState(false);

  useEffect(() => {
    const loadCatalogBottles = async () => {
      try {
        setLoading(true);
        const bottles = await fetchAllBottlesFromCatalog();
        setCatalogBottles(bottles);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch bottle catalog.");
        console.error("Error fetching bottles:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogBottles();
  }, []);

  const handleAddOrEditBottle = (bottle: BottleCatalog) => {
    setCurrentBottle(bottle);
    setModalName(bottle.name);
    setModalPrice(bottle.price.toString());
    setModalImageUrl(bottle.imageUrl);
    setIsModalVisible(true);
  };

  const handleSaveBottle = async () => {
    if (!currentBottle || !modalPrice || !modalName || !modalImageUrl) {
      Alert.alert("Error", "All fields, including the image, are required.");
      return;
    }

    const parsedPrice = parseFloat(modalPrice);

    if (isNaN(parsedPrice)) {
      Alert.alert("Error", "Price must be a valid number.");
      return;
    }

    try {
      setLoading(true);
      await updateBottleInCatalog(currentBottle.id, {
        name: modalName,
        price: parsedPrice,
        imageUrl: modalImageUrl,
      });
      Alert.alert("Success", "Bottle updated!");
      setIsModalVisible(false);
      const bottles = await fetchAllBottlesFromCatalog();
      setCatalogBottles(bottles);
    } catch (error) {
      console.error("Error updating bottle:", error);
      Alert.alert("Error", "Failed to update the bottle.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        if (currentBottle) {
          setLoading(true);
          const newImageUrl = await uploadBottleImage(currentBottle.id, result.assets[0].uri);

          if (typeof newImageUrl === "string") {
            setModalImageUrl(newImageUrl);
            Alert.alert("Success", "Image updated successfully!");
          } else {
            throw new Error("Invalid image URL returned.");
          }
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to edit the image.");
      console.error("Error editing image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBottle = async () => {
    if (!currentBottle) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${currentBottle.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteBottleFromCatalog(currentBottle.id);
              const updatedBottles = await fetchAllBottlesFromCatalog();
              setCatalogBottles(updatedBottles);
              setIsModalVisible(false);
              Alert.alert("Success", "Bottle deleted successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete bottle.");
              console.error("Error deleting bottle:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setNewBottleImage(result.assets[0].uri);
        setImageAdded(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick an image.");
      console.error("Error picking image:", error);
    }
  };

  const handleAddNewBottle = async () => {
    if (!newBottleName || !newBottlePrice || !newBottleImage) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    const parsedPrice = parseFloat(newBottlePrice);

    if (isNaN(parsedPrice)) {
      Alert.alert("Error", "Price must be a valid number.");
      return;
    }

    try {
      setLoading(true);
      await addBottleToCatalog({
        name: newBottleName,
        price: parsedPrice,
        imageUrl: newBottleImage,
      });

      const updatedBottles = await fetchAllBottlesFromCatalog();
      setCatalogBottles(updatedBottles);
      setNewBottleName("");
      setNewBottlePrice("");
      setNewBottleImage(null);
      setImageAdded(false);
      Alert.alert("Success", "Bottle added successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to add bottle.");
      console.error("Error adding bottle:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBottles = catalogBottles.filter((bottle) =>
    bottle.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Bottle Name"
          placeholderTextColor="#aaa"
          value={newBottleName}
          onChangeText={setNewBottleName}
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={newBottlePrice}
          onChangeText={setNewBottlePrice}
        />
        {imageAdded && <Text style={styles.imageAddedText}>Image added</Text>}
        <Text style={styles.textLink} onPress={handlePickImage}>
          Pick Image
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewBottle}>
          <Text style={styles.buttonText}>Add Bottle</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search bottles"
        value={searchText}
        onChangeText={setSearchText}
        style={styles.input}
        placeholderTextColor="#aaa"
      />

      <FlatList
        data={filteredBottles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.noBottlesText}>No bottles in the catalog.</Text>
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
              style={styles.closeModalButton}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Bottle</Text>
            <TextInput
              style={styles.input}
              placeholder="Bottle Name"
              placeholderTextColor="#aaa"
              value={modalName}
              onChangeText={setModalName}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={modalPrice}
              onChangeText={setModalPrice}
            />
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: modalImageUrl || "https://via.placeholder.com/150" }}
                style={styles.bottleImageLarge}
                resizeMode="contain"
              />
              <Text style={styles.textLink} onPress={handleEditImage}>
                Edit Image
              </Text>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveBottle}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteBottle}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
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
  formContainer: {
    backgroundColor: "#101010",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  imageAddedText: {
    textAlign: "center",
    color: "#fff",
    marginVertical: 10,
    fontSize: 14,
  },
  textLink: {
    textAlign: "center",
    color: "#fff",
    textDecorationLine: "underline",
    fontSize: 16,
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  bottleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101010",
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  bottleImage: {
    width: 50,
    height: 50,
    marginRight: 15,
    borderRadius: 5,
  },
  bottleName: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
  },
  noBottlesText: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 20,
  },
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  closeModalButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  saveButton: {
    backgroundColor: "#555",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  bottleImageLarge: {
    width: 150,
    height: 150,
    marginVertical: 10,
    alignSelf: "center",
    borderRadius: 10,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
});
