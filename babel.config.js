module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      'babel-preset-expo', // Includes support for Expo Router and JSX automatic runtime
    ],
    plugins: [
      // Module resolver for path aliases
      [
        'module-resolver',
        {
          root: ['./app'],
          alias: {
            '@': './',
            '@components': './components',
            '@tabs': './(tabs)',
            '@hooks': './hooks',
            '@utils': './utils',
            '@assets': './assets',
            '@contexts': './contexts',
            '@screens': './screens',
          },
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.json',
            '.web.js',
          ],
        },
      ],

      // Reanimated plugin (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};
