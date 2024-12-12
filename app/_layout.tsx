import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { Slot, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { UserProvider } from "../src/contexts/UserContext";
import { View, StyleSheet, Alert } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Provider as PaperProvider } from "react-native-paper";
import { StripeProvider } from "@stripe/stripe-react-native";
import Toast from "react-native-toast-message";
import { LoadingProvider } from "../src/contexts/LoadingContext";
import { NotificationProvider } from "../src/contexts/NotificationContext";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { registerForPushNotificationsAsync } from "../src/utils/notifications";

// Notifications setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Background notification task
const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({
    data,
    error,
    executionInfo,
  }: TaskManager.TaskManagerTaskBody<unknown>) => {
    try {
      console.log("✅ Received a notification in the background!", {
        data,
        error,
        executionInfo,
      });

      if (data) {
        console.log("Notification Data:", data);
      }

      return Promise.resolve();
    } catch (err) {
      console.error("Error in background notification task:", err);
      return Promise.reject(err);
    }
  }
);

const AppContent: React.FC = () => {
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);
  const [notificationsRegistered, setNotificationsRegistered] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log("Preparing app...");
        setAppReady(true);
      } catch (error) {
        console.error("Error during app preparation:", error);
      }
    };

    // Check for updates
    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            "Update Available",
            "An update has been downloaded and will be applied on restart.",
            [
              {
                text: "Restart Now",
                onPress: () => Updates.reloadAsync(),
              },
            ]
          );
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };

    checkForUpdates();
    prepareApp();
  }, []);

  useEffect(() => {
    const handleNavigation = async () => {
      if (!appReady) return;

      setTimeout(async () => {
        await SplashScreen.hideAsync();
        if (firebaseUser) {
          console.log("User authenticated, navigating to /tabs...");
          router.replace("/(tabs)");

          // Register for push notifications if not already registered
          if (!notificationsRegistered) {
            await registerForPushNotificationsAsync();
            setNotificationsRegistered(true);
          }
        } else {
          console.log("User not authenticated, navigating to /auth/Login...");
          router.replace("/(auth)/Login");
        }
      }, 700);
    };

    handleNavigation();
  }, [appReady, firebaseUser, notificationsRegistered, router]);

  if (!appReady) {
    return null; // Splash screen will handle the loading UI
  }

  return null;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <StripeProvider publishableKey={Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY}>
          <PaperProvider>
            <UserProvider>
              <LoadingProvider>
                <Slot />
                <AppContent />
                <Toast />
              </LoadingProvider>
            </UserProvider>
          </PaperProvider>
        </StripeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});