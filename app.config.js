// app.config.js

export default ({ config }) => {
  // Central version bump – start fresh at 1.0.0
  const appVersion = "1.0.0";
  const updateUrl = config.expo.updates?.url || "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b";
  const channel = config.expo.updates?.channel || "production";

  return {
    ...config,
    expo: {
      ...config.expo,

      // Bump version and sync runtimeVersion automatically
      version: appVersion,
      runtimeVersion: appVersion,

      // Ensure updates configuration is present
      updates: {
        url: updateUrl,
        channel: channel,
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

      // Include expo-updates plugin for bare workflow
      plugins: [
        ...(config.expo.plugins || []),
        'expo-updates',
      ],

      // Preserve other platform-specific configs
      ios: {
        ...config.expo.ios,
      },
      android: {
        ...config.expo.android,
      },
      web: config.expo.web,
      experiments: config.expo.experiments,
      extra: config.expo.extra,
    },
  };
};
