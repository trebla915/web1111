// app/_layout.tsx
import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as TaskManager from "expo-task-manager";
import { Provider as PaperProvider } from "react-native-paper";
import { StripeProvider } from "@stripe/stripe-react-native";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { AuthProvider } from "../src/contexts/AuthContext";
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AuthProvider>
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
