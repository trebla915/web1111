// app/_layout.tsx
import "react-native-get-random-values";
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as TaskManager from "expo-task-manager";
import { Provider as PaperProvider } from "react-native-paper";
import { StripeProvider } from "@stripe/stripe-react-native";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { UserProvider } from "../src/contexts/UserContext";
import { LoadingProvider } from "../src/contexts/LoadingContext";
import { NotificationProvider } from "../src/contexts/NotificationContext";
import { Slot } from 'expo-router';

// Keep splash visible until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {});

// Background notification task
const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error, executionInfo }) => {
    console.log("🔔 Background notification:", { data, error, executionInfo });
    return Promise.resolve();
  }
);

function SplashGuard() {
  const { isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);
  return null;
}

// Expo Updates checking component - Modern Expo SDK 53 approach
function UpdateChecker() {
  const {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending,
    isDownloading,
    availableUpdate,
    downloadError,
    isChecking
  } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      // Update has successfully downloaded; apply it now
      console.log("✅ Update downloaded and ready, reloading app...");
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  useEffect(() => {
    if (isUpdateAvailable && !isDownloading) {
      console.log("📱 Update available, showing prompt to user...");
      console.log("Current runtime version:", currentlyRunning.runtimeVersion);
      console.log("Available update:", availableUpdate?.updateId);
      
      // Import Alert dynamically to avoid conflicts
      import('react-native').then(({ Alert }) => {
        Alert.alert(
          "Update Available", 
          "A new version of the app is available. Would you like to download and install it now?",
          [
            {
              text: "Later",
              style: "cancel",
              onPress: () => console.log("User postponed update")
            },
            {
              text: "Install",
              onPress: () => {
                console.log("📥 User chose to install, fetching update...");
                Updates.fetchUpdateAsync();
              }
            }
          ]
        );
      });
    }
  }, [isUpdateAvailable, isDownloading, availableUpdate, currentlyRunning]);

  useEffect(() => {
    if (downloadError) {
      console.error("❌ Error downloading update:", downloadError);
      import('react-native').then(({ Alert }) => {
        Alert.alert("Update Failed", "Could not download the update. Please try again later.");
      });
    }
  }, [downloadError]);

  // Log current state for debugging
  useEffect(() => {
    if (!__DEV__ && Updates.isEnabled) {
      console.log("📊 Updates State:", {
        channel: Updates.channel,
        runtimeVersion: currentlyRunning?.runtimeVersion,
        updateId: currentlyRunning?.updateId,
        isChecking,
        isUpdateAvailable,
        isDownloading,
        isUpdatePending
      });
    }
  }, [currentlyRunning, isChecking, isUpdateAvailable, isDownloading, isUpdatePending]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AuthProvider>
          <UpdateChecker />
          <SplashGuard />
          <NotificationProvider>
            <StripeProvider publishableKey={Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY}>
              <UserProvider>
                <LoadingProvider>
                  <Slot />
                  <Toast />
                </LoadingProvider>
              </UserProvider>
            </StripeProvider>
          </NotificationProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
  },
});
