import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Image,
  Pressable,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

interface EditPostModalProps {
  visible: boolean;
  onSubmit: (text: string, imageUri?: string) => void;
  onCancel: () => void;
  currentText?: string;
  currentImage?: string;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  visible,
  onSubmit,
  onCancel,
  currentText = "",
  currentImage = "",
}) => {
  const [newText, setNewText] = useState(currentText);
  const [newImage, setNewImage] = useState<string | null>(currentImage);

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "We need access to your photos to upload.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setNewImage(pickerResult.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!newText.trim() && !newImage) {
      Alert.alert("Error", "Please provide text or an image.");
      return;
    }

    onSubmit(newText, newImage || undefined);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Post</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Update your text"
            value={newText}
            onChangeText={setNewText}
          />

          {newImage ? (
            <Image source={{ uri: newImage }} style={styles.previewImage} />
          ) : (
            <Text style={styles.placeholder}>No image selected</Text>
          )}

          <Pressable style={styles.imageButton} onPress={handleImagePick}>
            <Text style={styles.imageButtonText}>Pick a New Image</Text>
          </Pressable>

          <View style={styles.buttonContainer}>
            <Button title="Save Changes" onPress={handleSubmit} />
            <Button title="Cancel" color="red" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  textInput: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: "contain",
  },
  placeholder: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  imageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    marginBottom: 20,
  },
  imageButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});

export default EditPostModal;