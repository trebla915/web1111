import React, { createContext, useState, useContext, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Create the context with default values
const LoadingContext = createContext<{
  isLoading: boolean;
  setLoading: (state: boolean) => void;
}>({
  isLoading: false,
  setLoading: () => {}, // Default no-op function
});

// Provide the Loading Context to the app
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      <>
        {children}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </>
    </LoadingContext.Provider>
  );
};

// Hook to access the context
export const useLoading = () => useContext(LoadingContext);

// Styles for the loading overlay
const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensures it's on top of all other components
  },
});