const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.ts',
  'web.tsx',
  'web.js',
  'web.jsx',
  'cjs',
];

config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
  '@/assets': path.resolve(__dirname, './src/assets'),
  '@/images': path.resolve(__dirname, './src/assets/images'),
  '@/config': path.resolve(__dirname, './src/config'),
  '@/contexts': path.resolve(__dirname, './src/contexts'),
  '@/utils': path.resolve(__dirname, './src/utils'),
};

config.watchFolders = [
  path.resolve(__dirname, 'node_modules/react-native-web'),
  path.resolve(__dirname, 'src'),
  ...config.watchFolders,
];

module.exports = config;