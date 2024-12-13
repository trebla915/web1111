const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'web.ts',
  'web.tsx',
  'web.js',
  'web.jsx',
  'cjs' // Ensure 'cjs' is included
];

defaultConfig.resolver.alias = {
  '@': path.resolve(__dirname, './'),
  '@/assets': path.resolve(__dirname, './src/assets'),
  '@/images': path.resolve(__dirname, './src/assets/images'),
  '@/config': path.resolve(__dirname, './src/config'),
  '@/contexts': path.resolve(__dirname, './src/contexts'),
  '@/utils': path.resolve(__dirname, './src/utils')
};

defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  'react-native': require.resolve('react-native-web') // Map 'react-native' to 'react-native-web'
};

defaultConfig.watchFolders = [
  path.resolve(__dirname, 'node_modules/react-native-web'),
  path.resolve(__dirname, 'src'), // Add src folder to watch
  ...defaultConfig.watchFolders
];

module.exports = defaultConfig;