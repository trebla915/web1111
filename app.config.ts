import { ExpoConfig } from 'expo/config';
import { version } from './package.json';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: "11:11 EPTX",
  slug: "club-1111",
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
          CFBundleURLSchemes: ["exp+club-1111"]
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
            scheme: "exp+club-1111"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: "./src/assets/logo.png"
  },
  scheme: "exp+club-1111",
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
      projectId: "8c8109aa-fdc9-4f62-bc94-c98069af3c5d"
    }
  }
}); 