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
      return Promise.reject(error); // Return a rejected Promise for errors
    }

    console.log("\u2705 Received a notification in the background!", { data });

    // Process your notification data here
    if (data) {
      console.log("Notification Data:", data);
    }

    return Promise.resolve(); // Return a resolved Promise for success
  } catch (err) {
    console.error("Error in background notification task:", err);
    return Promise.reject(err); // Return a rejected Promise for unexpected errors
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
    const userId = await AsyncStorage.getItem("userId"); // Retrieve userId from storage or context

    if (!userId || userId.trim() === "") { // Ensure userId is valid and not empty
      throw new Error("User ID is missing or invalid. Ensure the user is logged in.");
    }

    const response = await apiClient.post("/notifications/save-push-token", { // Update route to match backend
      userId,
      expoPushToken: token,
    });

    console.log("Push token saved to the server:", response.data);
  } catch (error) {
    console.error("Failed to store push token:", error.message || error);
    throw error;
  }
}



// Request push notification permissions and get the Expo Push Token
export async function registerForPushNotificationsAsync() {
  try {
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

    // Get the Expo Push Token with the project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("EAS Project ID is missing in Expo Constants.");
      throw new Error("Project ID is missing. Ensure it is set in your environment.");
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Expo Push Token:", token);

    // Save the token to your backend
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
}: {
  title: string;
  message: string;
}) {
  try {
    const response = await apiClient.post("/send-notification", {
      title,
      message,
    });
    console.log("Push notification sent successfully:", response.data);
  } catch (error) {
    console.error("Failed to send push notification:", error);
    throw error;
  }
}
