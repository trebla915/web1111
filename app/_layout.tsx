import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { Slot, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { UserProvider } from "../src/contexts/UserContext";
import { View, StyleSheet, Alert, Animated } from "react-native";
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
      console.log("✅ Received a notification in the background!", { data, error, executionInfo });
      if (data) console.log("Notification Data:", data);
      return Promise.resolve();
    } catch (err) {
      console.error("Error in background notification task:", err);
      return Promise.reject(err);
    }
  }
);

const AppContent: React.FC = () => {
  const router = useRouter();
  const { firebaseUser, isLoading, token } = useAuth();
  const [appReady, setAppReady] = useState(false);
  const [notificationsRegistered, setNotificationsRegistered] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0)); // For fade-in animation

  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log("Preparing app...");
        await SplashScreen.preventAutoHideAsync(); // Prevent auto hide of splash screen
        setAppReady(true); // Only after everything is ready, allow app to show
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error("Error during app preparation:", error);
      }
    };

    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check for updates when app starts
    checkForUpdates();
    prepareApp();
  }, []);

  useEffect(() => {
    const handleNavigation = async () => {
      if (!appReady || isLoading) return; // Ensure app is ready and loading is complete

      setTimeout(async () => {
        await SplashScreen.hideAsync(); // Hide splash screen

        // If a token is available, navigate to the home screen, else stay on login screen
        if (token) {
          console.log("Token found, user authenticated, navigating to /tabs...");
          router.replace("/(tabs)");

          if (!notificationsRegistered) {
            await registerForPushNotificationsAsync();
            setNotificationsRegistered(true);
          }
        } else {
          console.log("No token found, staying on /auth/Login...");
          router.replace("/(auth)/Login"); // Stay on login screen
        }
      }, 700); // Adjust the timeout as necessary
    };

    handleNavigation();
  }, [appReady, isLoading, notificationsRegistered, token, router]);

  if (!appReady || isLoading || token === null) {
    return null; // Splash screen will handle the loading UI until app is ready
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Your app content goes here */}
    </Animated.View>
  );
};

export default function RootLayout() {
  // Add runtime version logging
  useEffect(() => {
    console.log("📦 ShellRuntime:", Updates.runtimeVersion);
    console.log("📦 AppVersion:", Constants.expoConfig?.version);
  }, []);

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
