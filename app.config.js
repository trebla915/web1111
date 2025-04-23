// app.config.js

export default ({ config }) => {
  // Central version bump – start fresh at 1.0.0
  const appVersion = "1.0.0";

  // Expo projectId for EAS linking
  const projectId = "e3775235-7f75-42c8-906e-8171c4a1e54b";

  return {
    // preserve any other top-level config
    ...config,
    expo: {
      ...config.expo,

      // sync version & runtimeVersion
      version: appVersion,
      runtimeVersion: appVersion,

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
          certificatePath: "./code-signing/certificate.pem"
        }
      },

      // include expo-updates plugin in bare
      plugins: [
        ...(config.expo.plugins || []),
        'expo-updates'
      ],

      // ensure extra.eas.projectId
      extra: {
        ...config.expo.extra,
        eas: {
          projectId
        }
      }
    }
  };
};
