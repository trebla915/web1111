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

// Ensure 'cjs' is added if not already included
if (!defaultConfig.resolver.sourceExts.includes('cjs')) {
  defaultConfig.resolver.sourceExts.push('cjs');
}

// Add custom path aliases
defaultConfig.resolver.alias = {
  '@': path.resolve(__dirname, './frontend'),
  '@/assets': path.resolve(__dirname, './frontend/src/assets'),
  '@/config': path.resolve(__dirname, './frontend/src/config'),
  '@/contexts': path.resolve(__dirname, './frontend/src/contexts'),
  '@/utils': path.resolve(__dirname, './frontend/src/utils'),
  // Add more aliases as needed
};

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