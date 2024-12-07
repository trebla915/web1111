import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useUser } from "../../src/contexts/UserContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { uploadImageToStorage } from "../../src/utils/uploadImageToStorage";
import { updateUserById } from "../../src/utils/users";
import * as ImagePicker from "expo-image-picker";
import { User } from '../../src/utils/types'; // Adjust the path as needed

const ProfileScreen: React.FC = () => {
  const { userData, isLoading } = useUser();
  const { firebaseUser, signOut } = useAuth();
  const [name, setName] = useState(userData?.name || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [phone, setPhone] = useState(userData?.phone || "");
  const [avatar, setAvatar] = useState(userData?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);

  const pickAvatarImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setIsUploading(true);
        const filePath = `avatars/${firebaseUser?.uid}_${Date.now()}.jpg`;
        const avatarUrl = await uploadImageToStorage(result.assets?.[0]?.uri || "", filePath);

        await updateUserById(userData!.id, { avatar: avatarUrl });
        setAvatar(avatarUrl);
        Alert.alert("Success", "Avatar updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", "Failed to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert("Error", "Name and Email are required.");
      return;
    }
  
    if (!userData) {
      Alert.alert("Error", "User data is unavailable.");
      return;
    }
  
    try {
      const updates: Partial<Omit<User, "reservations">> = {};
      if (name !== userData.name) updates.name = name;
      if (email !== userData.email) updates.email = email;
      if (phone !== userData.phone) updates.phone = phone || ""; // Clear phone value if empty
      if (avatar !== userData.avatar) updates.avatar = avatar || ""; // Clear avatar value if empty
  
      if (Object.keys(updates).length > 0) {
        await updateUserById(userData.id, updates);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("No Changes", "No changes to save.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firebaseUser?.delete();
              await signOut(); // Sign out after account deletion
              Alert.alert("Success", "Your account has been deleted.");
            } catch (error: any) {
              console.error("Error deleting account:", error);
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Re-authentication Required",
                  "Please log in again to delete your account."
                );
              } else {
                Alert.alert("Error", "Failed to delete your account.");
              }
            }
          },
        },
      ]
    );
  };

  if (isLoading || isUploading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>
          {isUploading ? "Uploading avatar..." : "Loading profile..."}
        </Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        {/* Avatar Section */}
        <TouchableOpacity onPress={pickAvatarImage}>
          <Image
            source={{ uri: avatar || "https://via.placeholder.com/150" }}
            style={styles.avatar}
          />
          <Text style={styles.changeAvatarText}>Change Avatar</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone (Optional)"
          value={phone}
          onChangeText={setPhone}
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20, textAlign: "center" },
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: "center", marginBottom: 10 },
  changeAvatarText: { color: "#aaa", textAlign: "center", marginBottom: 20 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
  deleteButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: { color: "#fff", fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  loadingText: { color: "#fff", fontSize: 16 },
});

export default ProfileScreen;