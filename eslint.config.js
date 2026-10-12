import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/generated/prisma/**',
      'docs/**',
      'supabase/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Waypoint's types are unions, generics and records of functions as often
      // as they are object shapes, so `type` is the one declaration form used.
      '@typescript-eslint/consistent-type-definitions': 'off',
      // An unused `_`-prefixed binding is a deliberately discarded value.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Discriminated-union switches must be exhaustive and end in assertNever.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // Immutability: no reassigning or mutating a parameter. Express middleware
      // is the exception — writing to `res.locals` is how it passes data on.
      'no-param-reassign': [
        'error',
        { props: true, ignorePropertyModificationsFor: ['req', 'res'] },
      ],
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Config and scripts are plain Node ESM, outside any TypeScript project.
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
    rules: { 'no-console': 'off' },
  },
  prettier,
)
