// frontend/src/components/NotificationBanner.tsx
import React from "react";
import { useNotification } from "../contexts/NotificationContext";
import { View, Text, StyleSheet } from "react-native";

const NotificationBanner = () => {
  const { notification } = useNotification();

  if (!notification) return null; // Don't render anything if there's no notification

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>{notification.request.content.title}</Text>
      <Text style={styles.body}>{notification.request.content.body}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#333",
    padding: 10,
    zIndex: 1000,
    elevation: 5, // For Android shadow
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  body: {
    color: "#ddd",
    fontSize: 14,
    marginTop: 4,
  },
});

export default NotificationBanner;