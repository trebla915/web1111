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

// Register background task
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

// Load environment variables using `Constants`
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error("Stripe Publishable Key is missing. Check your EAS secrets.");
  throw new Error("Missing Stripe Publishable Key.");
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const AppContent: React.FC = () => {
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

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
        } else {
          console.log("User not authenticated, navigating to /auth/Login...");
          router.replace("/(auth)/Login");
        }
      }, 700);
    };

    handleNavigation();
  }, [appReady, firebaseUser, router]);

  if (!appReady) {
    return null; // Splash screen will handle the loading UI
  }

  return null;
};

export default function RootLayout() {
  return (
    <NotificationProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <PaperProvider>
          <AuthProvider>
            <UserProvider>
              <LoadingProvider>
                <Slot />
                <AppContent />
                <Toast />
              </LoadingProvider>
            </UserProvider>
          </AuthProvider>
        </PaperProvider>
      </StripeProvider>
    </NotificationProvider>
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
