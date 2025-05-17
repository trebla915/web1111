import { ExpoConfig } from 'expo/config';
import { version } from './package.json';

console.log("EXPO_PUBLIC_EAS_PROJECT_ID:", process.env.EXPO_PUBLIC_EAS_PROJECT_ID);

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  newArchEnabled: true,     // 🔥 Enable React Native New Architecture
  name: "11:11 EPTX",
  slug: "club1111",
  owner: "tr3bla915",
  version,
  orientation: "portrait",
  icon: "./src/assets/logo.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./src/assets/logo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.your.club1111",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["exp+club1111"]
        }
      ],
      CFBundleDisplayName: "11:11 EPTX",
      CFBundleName: "11:11 EPTX"
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./src/assets/logo.png",
      backgroundColor: "#ffffff"
    },
    package: "com.your.club1111",
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
    favicon: "./src/assets/logo.png"
  },
  scheme: "exp+club1111",
  plugins: [
    "expo-router",
    "expo-updates"
  ],
  updates: {
    url: "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b"
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "e3775235-7f75-42c8-906e-8171c4a1e54b"
    },
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
