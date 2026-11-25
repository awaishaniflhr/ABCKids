// Jest stand-in for the phone's storage: a simple in-memory store.
// Test files that call jest.mock() for this module with their own fake still
// use theirs.
let store = {};

const AsyncStorage = {
  getItem: jest.fn(async key => (key in store ? store[key] : null)),
  setItem: jest.fn(async (key, value) => {
    store[key] = String(value);
  }),
  removeItem: jest.fn(async key => {
    delete store[key];
  }),
  clear: jest.fn(async () => {
    store = {};
  }),
  // Test helper: empty the store between tests.
  __reset() {
    store = {};
  },
};

module.exports = { __esModule: true, default: AsyncStorage, ...AsyncStorage };
