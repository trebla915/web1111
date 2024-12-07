// frontend/app/_layout.tsx
import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { Slot, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { UserProvider } from "../src/contexts/UserContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager"; // Import TaskManager
import { Provider as PaperProvider } from "react-native-paper";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import Toast from "react-native-toast-message"; // Import Toast
import { LoadingProvider } from "../src/contexts/LoadingContext"; // Import the LoadingProvider
import { NotificationProvider } from "../src/contexts/NotificationContext";
import NotificationBanner from "../src/components/NotificationBanner"; // Import NotificationBanner

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error, executionInfo }: TaskManager.TaskManagerTaskBody<unknown>) => {
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

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

const PUBLIC_KEY =
  Constants.expoConfig?.extra?.stripePublishableKey || "your-default-key";

SplashScreen.preventAutoHideAsync();

const AppContent: React.FC = () => {
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        setAppReady(true);
      } catch (error) {
        console.error("Error during app preparation:", error);
      }
    };
    prepareApp();
  }, []);

  useEffect(() => {
    const handleNavigation = async () => {
      if (!appReady || isLoading) return;

      setTimeout(async () => {
        await SplashScreen.hideAsync();
        if (firebaseUser) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/Login");
        }
      }, 500);
    };

    handleNavigation();
  }, [appReady, isLoading, firebaseUser, router]);

  if (isLoading || !appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return null;
};

export default function RootLayout() {
  return (
    <NotificationProvider>
      <StripeProvider publishableKey={PUBLIC_KEY}>
        <PaperProvider>
          <AuthProvider>
            <UserProvider>
              <LoadingProvider>
                <NotificationBanner />
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