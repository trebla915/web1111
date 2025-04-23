import "react-native-get-random-values";
import React, { useEffect, useState, useCallback } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
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
import '../src/styles/global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

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
  const { isLoading, token, refreshAuthToken } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Load auth token
        const newToken = await refreshAuthToken();
        
        // Check for updates
        await checkForUpdates();
        
        // Set ready state
        setIsReady(true);
      } catch (error) {
        console.error("Error preparing app:", error);
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (token && !inTabsGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }

    // Mark app as ready for splash screen
    setAppIsReady(true);
  }, [token, segments, isReady]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  };

  if (!isReady || isLoading) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Slot />
    </View>
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
  container: {
    flex: 1,
  },
});
