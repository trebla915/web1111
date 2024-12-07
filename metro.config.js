// metro.config.js

const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

// Get the default Metro config
const defaultConfig = getDefaultConfig(__dirname);

// Add support for additional file extensions for web
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'web.ts',
  'web.tsx',
  'web.js',
  'web.jsx', // Include all the web-specific extensions
];

// Map 'react-native' imports to 'react-native-web' for web builds
defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  'react-native': require.resolve('react-native-web'), // Ensure react-native maps to react-native-web on the web
};

// Ensure all files within node_modules that are required for web are included
defaultConfig.watchFolders = [
  path.resolve(__dirname, 'node_modules/react-native-web'),
  ...defaultConfig.watchFolders,
];

// Export the modified configuration
module.exports = defaultConfig;
