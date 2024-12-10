import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import Constants from "expo-constants";
import { Platform } from "react-native";

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
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
  if (error) {
    console.error("Error in background notification task:", error);
    return;
  }
  console.log("✅ Received a notification in the background!", { data });
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