export default ({ config }) => ({
  expo: {
    name: "11:11 EPTX",
    slug: "club1111",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./src/assets/images/icon.png",
    scheme: "club1111",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    updates: {
      url: "https://u.expo.dev/e3775235-7f75-42c8-906e-8171c4a1e54b",
      branch: "production",
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD",
      enabled: true
    },
    runtimeVersion: "1.0.4",
    platforms: ["ios", "android", "web"],
  },
})