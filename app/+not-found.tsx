import React from "react";
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

// Corrected Imports
import ThemedText from '../src/components/ThemedText';
import { ThemedView } from '../src/components/ThemedView';

export default function NotFoundScreen() {
  // --- Add deeper logging
  console.log("[+not-found]", {
    location: "native", // Simplified for React Native
    time: new Date().toISOString(),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen doesn&apos;t exist.</ThemedText>
        <Link href="/(tabs)" style={styles.link}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});