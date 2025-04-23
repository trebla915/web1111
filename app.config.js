// app.config.js
// Dynamic config for Expo SDK 52 in bare workflow

export default ({ config }) => {
  // Starting fresh at version 1.0.0
  const appVersion = "1.0.0";
  const projectId = "e3775235-7f75-42c8-906e-8171c4a1e54b";

  return {
    // Preserve all existing config fields (name, slug, orientation, etc.)
    ...config,

    // Override version & runtimeVersion
    version: appVersion,
    runtimeVersion: appVersion,

    // Ensure updates block is defined
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

    // Include expo-updates plugin for bare workflow
    plugins: [
      ...(config.plugins || []),
      'expo-updates'
    ],

    // Ensure EAS project ID is set for linking
    extra: {
      ...config.extra,
      eas: {
        projectId
      }
    }
  };
};