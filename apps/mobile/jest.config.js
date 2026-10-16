module.exports = {
  preset: 'jest-expo',
  setupFiles: [
    './jest.env.ts',
    'react-native-unistyles/mocks',
    './src/theme/unistyles.ts',
  ],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Jest resolves the "react-native" condition, which points at ESM (.mjs) files it can't run.
    '^lucide-react-native$':
      '<rootDir>/../../node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|react-navigation|@react-navigation/.*|react-native-svg|lucide-react-native|react-native-unistyles|react-native-nitro-modules|@waypoint/.*|standard-navigation))',
  ],
};
