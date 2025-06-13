import { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: "11:11 EPTX",
  slug: "club1111",
  owner: "tr3bla915",
  version: "1.0.8",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000"
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
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.your.club1111",
    googleServicesFile: "./google-services.json"
  },
  web: {
    favicon: "./assets/icon.png"
  },
  scheme: "exp+club1111",
  plugins: [
    "expo-router",
    "expo-updates",
    "expo-notifications"
  ],
  updates: {
    url: "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b"
  },
  runtimeVersion: {
    policy: "fingerprint"
  },
  extra: {
    eas: {
      projectId: "e3775235-7f75-42c8-906e-8171c4a1e54b"
    }
  }
}); 