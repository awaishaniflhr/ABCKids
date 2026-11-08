module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.(mp3|wav)$': '<rootDir>/__tests__/fixtures/mediaAsset.cjs',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-navigation|@react-native-async-storage)(/|-))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.migration-build/'],
};
