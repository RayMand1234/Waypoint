import { setUpTests } from 'react-native-reanimated';

// Worklets has no native runtime in Jest; Reanimated then runs animations in JS.
jest.mock('react-native-worklets', () =>
  jest.requireActual<Record<string, unknown>>('react-native-worklets/src/mock'),
);

setUpTests();

// AsyncStorage has no native module in Jest; its package ships an in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<Record<string, unknown>>(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
