import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  registerForPushNotificationsAsync, 
  registerBackgroundNotificationTask,
  setupNotificationChannels
} from "../utils/notifications";
import { useAuth } from "./AuthContext";

type EventSubscription = {
  remove: () => void;
};

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { firebaseUser } = useAuth(); // Access user state from AuthContext

  const notificationListener = useRef<EventSubscription>();
  const responseListener = useRef<EventSubscription>();

  useEffect(() => {
    // Set up notification channels for Android
    setupNotificationChannels();
    
    // Register background task
    registerBackgroundNotificationTask();
  }, []);

  useEffect(() => {
    const registerToken = async () => {
      if (!firebaseUser) {
        console.log("Skipping push token registration. User not logged in.");
        return;
      }

      try {
        // Set the user ID in AsyncStorage so it can be accessed by the notifications utility
        await AsyncStorage.setItem("userId", firebaseUser.uid);
        
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log("Successfully registered for push notifications with token:", token);
          setExpoPushToken(token);
        }
      } catch (err) {
        console.error("Error registering push token:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    registerToken();
  }, [firebaseUser]);

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("🔔 Notification Response: ", response);
        // Handle notification response here if needed
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 