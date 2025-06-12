// File: AccountScreen.tsx
// Summary: Handles user account details, navigation options, and logout functionality.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext'; // Authentication context
import { useUser } from '../../src/contexts/UserContext'; // User context for user data
import Constants from 'expo-constants';

const AccountScreen: React.FC = () => {
  const { signOut } = useAuth(); // Sign-out functionality from AuthContext
  const { userData, isLoading } = useUser(); // User data and loading state from UserContext
  const router = useRouter();
  
  // Debug logging
  console.log('Constants:', {
    appVersion: Constants.appVersion,
    nativeAppVersion: Constants.nativeAppVersion,
    manifest: Constants.manifest,
    expoConfig: Constants.expoConfig
  });
  
  // Use the version from expoConfig for accuracy in EAS builds
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut();
      Alert.alert('Logged Out', 'You have been successfully logged out.');
      router.replace('/(auth)/Login');
    } catch (error: any) {
      console.error('Error during logout:', error.message || error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  // Loading state for user data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading user information...</Text>
      </View>
    );
  }

  // Handle case where user data is not found
  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>No user is currently logged in.</Text>
        {/* OTA update test text - TEMPORARY FOR TESTING */}
                      <Text style={styles.otaTest}>🚀 NEW OTA UPDATE TEST - BUILD 45! 🚀</Text>
        <Text style={styles.infoText}>↑ If you see this message, OTA updates are working! ↑</Text>
        <TouchableOpacity
          style={[styles.card, styles.outlinedCard]}
          onPress={() => router.replace('/(auth)/Login')}
        >
          <Text style={styles.cardText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* User Avatar Section */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: userData.avatar || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
      </View>

      {/* User Information Section */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.userName}>{userData.name || 'John Doe'}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
        {userData.phone && <Text style={styles.userPhone}>📞 {userData.phone}</Text>}
        <Text style={styles.appVersion}>App Version: {appVersion}</Text>
        {/* OTA update test text */}
        <Text style={styles.testMessage}>
          🚀 NEW OTA UPDATE TEST - BUILD 45! 🚀
        </Text>
      </View>

      {/* Navigation and Logout Options */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(user)/Profile')}>
          <Ionicons name="person-circle" size={28} color="#fff" />
          <Text style={styles.cardText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(user)/Reservations')}>
          <Ionicons name="calendar" size={28} color="#fff" />
          <Text style={styles.cardText}>Reservations</Text>
        </TouchableOpacity>

        {/* Admin Dashboard Access */}
        {(userData.role === 'admin' || userData.role === 'promoter') && (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(admin)/Dashboard')}>
            <MaterialIcons name="dashboard" size={28} color="#fff" />
            <Text style={styles.cardText}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Logout Option */}
        <TouchableOpacity style={styles.card} onPress={handleLogout}>
          <MaterialIcons name="logout" size={28} color="#fff" />
          <Text style={styles.cardText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 16,
    color: '#aaa',
  },
  userPhone: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  cardsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
    marginBottom: 15,
  },
  cardText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: '#fff',
  },
  appVersion: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  otaTest: {
    fontSize: 16,
    color: '#ffff00',
    marginTop: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testMessage: {
    fontSize: 16,
    color: '#ffff00',
    marginTop: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AccountScreen;
