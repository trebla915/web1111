import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface WritePostInputProps {
  onSubmit: (text: string, imageUri?: string) => void;
  isCommentInput?: boolean; // Determines if the input is for comments
  placeholder?: string; // Customizable placeholder
}

const WritePostInput: React.FC<WritePostInputProps> = ({
  onSubmit,
  isCommentInput = false,
  placeholder = "Write something...",
}) => {
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleSubmit = () => {
    const validImageUri = imageUri ?? undefined;

    if (text.trim() || validImageUri) {
      onSubmit(text.trim(), isCommentInput ? undefined : validImageUri); // Comments don't require an image
      setText(""); // Clear the input text
      setImageUri(null); // Clear the selected image
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.inputContainer}>
        {!isCommentInput && imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <TouchableOpacity style={styles.removeButton} onPress={handleRemoveImage}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#ccc"
            value={text}
            onChangeText={setText}
          />
          {!isCommentInput && (
            <TouchableOpacity onPress={handleImagePick} style={styles.iconButton}>
              <Ionicons name="image" size={24} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSubmit} style={styles.iconButton}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1c1c1c",
  },
  inputContainer: {
    backgroundColor: "#333",
    padding: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    color: "white",
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  iconButton: {
    marginLeft: 5,
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 10,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#444",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#555",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 15,
    padding: 5,
  },
});

export default WritePostInput;