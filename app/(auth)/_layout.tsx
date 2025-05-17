// app/(auth)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AuthLayout() {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  if (token) {
    return <Redirect href="/(tabs)" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
      <Stack.Screen name="login" /> {/* lowercase to match your navigation */}
      <Stack.Screen name="register" /> {/* lowercase to match your file name */}
    </Stack>
  );
}