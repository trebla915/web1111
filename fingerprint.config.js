/** @type {import('@expo/fingerprint').Config} */
const config = {
  ignorePaths: [
    "ios/**/*",  // Ignore bare native ios directory differences
    "node_modules/react-native-webview/**/*"  // Ignore webview hash differences
  ]
};

module.exports = config; 