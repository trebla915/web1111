import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    // Apply to all files
    ignores: ['node_modules/**', '.next/**', 'out/**'],
  },
  {
    // JavaScript files
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      next: nextPlugin,
    },
    rules: {
      // Your JavaScript-specific rules
      'next/core-web-vitals': 'error',
    },
  },
  {
    // TypeScript files
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      next: nextPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Your TypeScript-specific rules
      'next/core-web-vitals': 'error',
      // Add any other TypeScript-specific rules
    },
  },
]; 