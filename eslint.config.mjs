import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Flat ESLint config.
 *
 * The Next plugin must be registered under the key `@next/next`: its
 * recommended ruleset names rules as `@next/next/<rule>`, so registering it as
 * `next` (as this file previously did) made every rule reference resolve to a
 * plugin that was not present, and `eslint` aborted before linting a file.
 *
 * react-hooks is registered because the codebase carries
 * `eslint-disable-next-line react-hooks/exhaustive-deps` comments; without the
 * plugin those disables reference an unknown rule and are themselves errors.
 */
const nextRules = {
  ...nextPlugin.configs.recommended.rules,
  ...nextPlugin.configs['core-web-vitals'].rules,
};

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'functions/**',
      'public/**',
      '.claude/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    plugins: { '@next/next': nextPlugin },
    rules: nextRules,
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {
      ...nextRules,
      ...reactHooks.configs.recommended.rules,
    },
  },
];
