import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { sendPushNotification } from "../../src/utils/notifications"; // Import the utility function

export default function PushNotificationScreen() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSendNotification = async () => {
    if (!title || !message) {
      Alert.alert("Error", "Both title and message are required.");
      return;
    }

    try {
      // Call the function to send the push notification
      await sendPushNotification({ title, message });
      Alert.alert("Success", "Push notification sent successfully!");
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Error sending push notification:", error);
      Alert.alert("Error", "Failed to send push notification.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Send Push Notification</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        placeholderTextColor="#aaa"
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSendNotification}>
        <Text style={styles.buttonText}>Send Notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  heading: { fontSize: 20, color: "#fff", marginBottom: 20 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
