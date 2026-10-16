import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

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
      'apps/mobile/.expo/**',
      'apps/mobile/expo-env.d.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
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
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Every switch over a union must cover every member (callers still end
      // theirs in assertNever by convention; the rule itself only checks
      // coverage). requireDefaultForNonUnion also catches a switch over a
      // plain string/number with no default.
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { requireDefaultForNonUnion: true },
      ],
      // Immutability: no reassigning or mutating a parameter. Express middleware
      // is the exception — writing to `res.locals` is how it passes data on.
      'no-param-reassign': [
        'error',
        { props: true, ignorePropertyModificationsFor: ['req', 'res'] },
      ],
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // A blank line before `return` and after a run of declarations, so a
      // function reads as separated statements/paragraphs, not one block.
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
    },
  },
  {
    // React rules for the app: hooks only at the top level, complete deps.
    files: ['apps/mobile/**/*.tsx', 'apps/mobile/**/*.ts'],
    extends: [reactHooks.configs.flat['recommended-latest']],
  },
  {
    // Code that runs on the phone. Hermes lacks the ES2023 copying array
    // methods (toSorted & co.) that Node — and so Jest — has: tests pass, the app
    // crashes with "undefined is not a function". Copy, then sort/reverse/splice.
    files: [
      'apps/mobile/src/**/*.{ts,tsx}',
      'apps/mobile/app/**/*.{ts,tsx}',
      'packages/contracts/src/**/*.ts',
    ],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression > MemberExpression.callee > Identifier.property[name=/^(toSorted|toReversed|toSpliced|with)$/]",
          message:
            'Hermes has no toSorted/toReversed/toSpliced/with — copy first: [...list].sort(…).',
        },
      ],
    },
  },
  {
    // The app's Babel / Jest config files are CommonJS run by Node.
    files: ['apps/mobile/*.js'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
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
);
