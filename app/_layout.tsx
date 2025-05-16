// app/_layout.tsx
import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
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
import { registerForPushNotificationsAsync } from "../src/utils/notifications";

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

const AppContent: React.FC = () => {
  const { isLoading, token, refreshAuthToken } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Refresh auth and register for push notifications
        await refreshAuthToken();
        await registerForPushNotificationsAsync();

        // Check for OTA updates in production
        if (Constants.expoConfig?.extra?.eas?.projectId && !__DEV__) {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            }
          } catch (err) {
            console.warn("Update check skipped:", err);
          }
        }
      } catch (err) {
        console.warn("App prep error:", err);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    console.log('[Debug] appIsReady:', appIsReady);
    console.log('[Debug] isLoading:', isLoading);
    console.log('[Debug] token:', token);
    console.log('[Debug] segments:', segments);
    if (!appIsReady || isLoading) return;
    const inAuth = segments[0] === "(auth)";
    const inTabs = segments[0] === "(tabs)";

    if (!token && !inAuth) {
      router.replace("/(auth)/login");
    } else if (token && !inTabs) {
      router.replace("/(tabs)");
    }
  }, [appIsReady, isLoading, token, segments]);

  if (!appIsReady || isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AuthProvider>
          <NotificationProvider>
            <StripeProvider publishableKey={Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY}>
              <UserProvider>
                <LoadingProvider>
                  <AppContent />
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
