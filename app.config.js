// app.config.js

export default ({ config }) => {
  // Central version bump – start fresh at 1.0.0
  const appVersion = "1.0.0";
  const projectId = "e3775235-7f75-42c8-906e-8171c4a1e54b";

  return {
    expo: {
      // Preserve existing Expo config fields
      ...config.expo,

      // Sync version & runtimeVersion
      version: appVersion,
      runtimeVersion: appVersion,

      // OTA update configuration
      updates: {
        url: config.expo.updates?.url || "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b",
        channel: config.expo.updates?.channel || "production",
        fallbackToCacheTimeout: 0,
        checkAutomatically: "ON_LOAD",
        enabled: true,
        codeSigning: {
          keyId: "main",
          algorithm: "rsa-v1_5-sha256",
          privateKeyPath: "./code-signing/private-key.pem",
          certificatePath: "./code-signing/certificate.pem",
        },
      },

      // Ensure expo-updates plugin is included in bare workflow
      plugins: [
        ...(config.expo.plugins || []),
        'expo-updates',
      ],

      // EAS project linkage
      extra: {
        ...config.expo.extra,
        eas: {
          projectId,
        },
      },
    },
  };
};