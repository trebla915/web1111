import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "./api"; // Import the centralized API client
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the background notification task name
const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

// Configure how notifications are handled in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Define the background notification task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  try {
    if (error) {
      console.error("Error in background notification task:", error);
      return Promise.reject(error);
    }

    console.log("✅ Received a notification in the background!", { data });

    // Process your notification data here
    if (data) {
      console.log("Notification Data:", data);
    }

    return Promise.resolve();
  } catch (err) {
    console.error("Error in background notification task:", err);
    return Promise.reject(err);
  }
});

// Register the background notification task
export async function registerBackgroundNotificationTask() {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log("Background notification task registered successfully.");
  } catch (error) {
    console.error("Failed to register background notification task:", error);
  }
}

// Store Expo Push Token to backend using the API client
export async function storePushToken(token: string) {
  try {
    const userId = await AsyncStorage.getItem("userId"); // Retrieve userId from storage

    if (!userId || userId.trim() === "") {
      console.warn("User ID is missing. Push token will not be registered.");
      return; // Skip if no userId
    }

    // Avoid duplicate token registrations by checking the stored token
    const storedToken = await AsyncStorage.getItem("storedPushToken");
    if (storedToken === token) {
      console.log("Push token is already registered. Skipping registration.");
      return;
    }

    const response = await apiClient.post("/notifications/save-push-token", {
      userId,
      expoPushToken: token,
    });

    console.log("Push token saved to the server:", response.data);

    // Store the token locally to avoid duplicate registrations
    await AsyncStorage.setItem("storedPushToken", token);
  } catch (error) {
    console.error("Failed to store push token:", error);
    throw error;
  }
}

// Request push notification permissions and get the Expo Push Token
export async function registerForPushNotificationsAsync() {
  try {
    const userId = await AsyncStorage.getItem("userId");

    if (!userId) {
      console.warn("Cannot register for push notifications. User is not logged in.");
      return null; // Skip if no userId
    }

    // Request permissions for notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      throw new Error("Permission not granted for push notifications!");
    }

    const projectId = process.env.EAS_PROJECT_ID;
    if (!projectId) {
      console.error("EAS Project ID is missing in environment variables.");
      throw new Error("Project ID is missing.");
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Expo Push Token:", token);

    // Save the token to the backend
    await storePushToken(token);

    return token;
  } catch (error) {
    console.error("Failed to register for push notifications:", error);
    return null;
  }
}

// Set up notification channels (for Android)
export async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
      console.log("Notification channel set up for Android.");
    } catch (error) {
      console.error("Failed to set up notification channel:", error);
    }
  }
}

// Send push notifications using the API client
export async function sendPushNotification({
  title,
  message,
  data = {},
}: {
  title: string;
  message: string;
  data?: object;
}) {
  try {
    const response = await apiClient.post("/notifications/send-notification", {
      title,
      message,
      data,
    });
    console.log("Push notification request sent successfully:", response.data);
  } catch (error) {
    console.error("Failed to send push notification request:", error);
    throw error;
  }
}