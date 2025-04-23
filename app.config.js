// app.config.js

export default ({ config }) => {
  // Central version bump – start fresh at 1.0.0
  const appVersion = "1.0.0";

  return {
    // Spread existing expo config fields
    ...config,

    // Bump version and sync runtimeVersion automatically
    version: appVersion,
    runtimeVersion: appVersion,

    // Configure OTA updates with code signing
    updates: {
      url: config.updates?.url || "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b",
      channel: config.updates?.channel || "production",
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD",
      enabled: true,
      codeSigning: {
        keyId: "main",
        algorithm: "rsa-v1_5-sha256",
        privateKeyPath: "./code-signing/private-key.pem",
        certificatePath: "./code-signing/certificate.pem"
      }
    },

    // Ensure expo-updates plugin is included for bare workflow
    plugins: [
      ...(config.plugins || []),
      'expo-updates'
    ],

    // Preserve platform-specific configs
    ios: config.ios,
    android: config.android,
    web: config.web,
    experiments: config.experiments,
    extra: config.extra
  };
};