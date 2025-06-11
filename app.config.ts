import { ExpoConfig } from 'expo/config';
import { version } from './package.json';

console.log("EXPO_PUBLIC_EAS_PROJECT_ID:", process.env.EXPO_PUBLIC_EAS_PROJECT_ID);

// Bump for new TestFlight build

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  // newArchEnabled: true,     // 🔥 Temporarily disabled - can cause build issues
  name: "11:11 EPTX",
  slug: "club1111",
  owner: "tr3bla915",
  version,
  orientation: "portrait",
  icon: "./src/assets/images/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./src/assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.your.club1111",
    googleServicesFile: "./GoogleService-Info.plist",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["exp+club1111"]
        }
      ],
      CFBundleDisplayName: "11:11 EPTX",
      CFBundleName: "11:11 EPTX",
      NSCameraUsageDescription: "This app uses the camera to allow users to scan QR codes, take photos, or upload images for their profile or reservations."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.your.club1111",
    googleServicesFile: "./google-services.json",
    intentFilters: [
      {
        action: "VIEW",
        data: [
          {
            scheme: "exp+club1111"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: "./src/assets/images/icon.png"
  },
  scheme: "exp+club1111",
  plugins: [
    "expo-router",
    "expo-updates",
    "expo-notifications"
  ],
  updates: {
    url: "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b",
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 30000
  },
  runtimeVersion: "1.0.8",
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "e3775235-7f75-42c8-906e-8171c4a1e54b"
    },
    // API Configuration
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    // Firebase Configuration
    FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
  }
});
