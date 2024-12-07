// RootLayout.tsx or App.tsx (depending on your project structure)

import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { UserProvider } from '../src/contexts/UserContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Provider as PaperProvider } from 'react-native-paper';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message'; // Import Toast
import { LoadingProvider } from '../src/contexts/LoadingContext'; // Import the LoadingProvider

// Use environment variables from Expo Constants
const PUBLIC_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 'your-default-key';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const AppContent: React.FC = () => {
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuth(); // Use AuthContext to determine user authentication state
  const [appReady, setAppReady] = useState(false);

  // Simulate additional app preparation tasks
  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log('Preparing app...');
        setAppReady(true);
      } catch (error) {
        console.error('Error during app preparation:', error);
      }
    };
    prepareApp();
  }, []);

  // Handle navigation based on user authentication state
  useEffect(() => {
    const handleNavigation = async () => {
      if (!appReady || isLoading) return;

      await SplashScreen.hideAsync(); // Hide splash screen once app is ready

      if (firebaseUser) {
        console.log('User authenticated, navigating to /tabs...');
        router.replace('/(tabs)');
      } else {
        console.log('User not authenticated, navigating to /auth/Login...');
        router.replace('/(auth)/Login');
      }
    };

    handleNavigation();
  }, [appReady, isLoading, firebaseUser, router]);

  // Show loading indicator while app is preparing or loading user data
  if (isLoading || !appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // AppContent doesn't render UI directly; it's handled by RootLayout
  return null;
};

// Main application layout wrapping all contexts and providing global setup
export default function RootLayout() {
  return (
    <StripeProvider publishableKey={PUBLIC_KEY}>
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
  );
}
// Styles for the loading screen
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
