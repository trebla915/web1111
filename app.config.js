export default ({ config }) => ({
  expo: {
    name: "11:11 EPTX",
    slug: "club1111",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./src/assets/images/icon.png", // App icon
    scheme: "club1111",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    updates: {
      url: "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b",
    },
    runtimeVersion: "1.0.4",
    platforms: ["ios", "android", "web"], // Add web to the platforms array
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.your.club1111",
      googleServicesFile: "./src/config/GoogleService-Info.plist",
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "This app requires access to your photo library to upload images.",
        NSCameraUsageDescription:
          "This app requires access to your camera to take photos.",
        NSLocationWhenInUseUsageDescription:
          "This app requires access to your location to provide location-based features.",
        FirebaseAppDelegateProxyEnabled: false,
        UIBackgroundModes: ["remote-notification"],
        CFBundleAllowMixedLocalizations: true,
        CFBundleLocalizations: ["en", "es"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/images/adaptive-icon.png",
        backgroundColor: "#000000",
      },
      package: "com.your.club1111",
      googleServicesFile: "./src/config/google-services.json",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
      ],
      notification: {
        icon: "./assets/notification-icon.png",
        color: "#fff",
      },
    },
    web: {
      bundler: "metro", // Use metro bundler for web
      output: "static", // Output as static files
      favicon: "./src/assets/images/favicon.png", // Web favicon
      build: {
        publicPath: "/",
      },
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./src/assets/images/splash.png",
          enableFullScreenImage_legacy: true,
          resizeMode: "cover",
          backgroundColor: "#000000",
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "This app requires access to your photo library to upload flyers.",
          cameraPermission:
            "This app requires access to your camera to take photos for flyers.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      API_BASE_URL: process.env.API_BASE_URL || "",
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY || "",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.FIREBASE_APP_ID || "",
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || "",
      },
      eas: {
        projectId: "e3775235-7f75-42c8-906e-8171c4a1e54b",
      },
    },
  },
});