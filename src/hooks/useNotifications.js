import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/notifications";

export const useNotifications = () => {
  useEffect(() => {
    const initialize = async () => {
      const tokens = await registerForPushNotificationsAsync();
      console.log("Notification Tokens:", tokens);
    };

    initialize();

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification Received:", notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification Clicked:", response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);
};