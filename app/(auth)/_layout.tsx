import { Stack } from 'expo-router';
// In /frontend/app/(admin)/_layout.tsx
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';

// In /frontend/app/(tabs)/TabLayout.tsx
import { useUser } from '../../src/contexts/UserContext';

import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { firebaseUser } = useAuth();  // Access user authentication state

  // Redirect to tabs if already authenticated
  if (firebaseUser) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" />
      <Stack.Screen name="Register" />
    </Stack>
  );
}
