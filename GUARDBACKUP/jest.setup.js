// Jest setup: mock native-only modules so store/service logic is unit-testable.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
