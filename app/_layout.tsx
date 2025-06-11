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

// Expo Updates checking component with user prompts
function UpdateChecker() {
  useEffect(() => {
    async function checkForUpdate() {
      try {
        // Only check for updates in production builds
        if (!__DEV__ && Updates.isEnabled) {
          console.log("🔄 Checking for updates...");
          console.log("Current update ID:", Updates.updateId);
          console.log("Channel:", Updates.channel);
          console.log("Runtime version:", Updates.runtimeVersion);
          
          const update = await Updates.checkForUpdateAsync();
          console.log("Update check result:", {
            isAvailable: update.isAvailable,
            manifest: update.manifest?.id,
          });
          
          if (update.isAvailable) {
            console.log("📱 Update available!");
            
            // Import Alert here to avoid conflicts
            const { Alert } = await import('react-native');
            
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
                  onPress: async () => {
                    try {
                      console.log("📱 User chose to install update, fetching...");
                      await Updates.fetchUpdateAsync();
                      console.log("✅ Update fetched, reloading...");
                      await Updates.reloadAsync();
                    } catch (error) {
                      console.error("❌ Update install failed:", error);
                      Alert.alert("Update Failed", "Could not install the update. Please try again later.");
                    }
                  }
                }
              ]
            );
          } else {
            console.log("✅ App is up to date");
          }
        } else {
          console.log("📱 Skipping update check (development mode or updates disabled)");
        }
      } catch (error) {
        console.error("❌ Update check failed:", error);
      }
    }
    
    // Check for updates with a small delay to ensure app is initialized
    const timeoutId = setTimeout(checkForUpdate, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

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
