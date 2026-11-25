import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

// The splash waits for Home and its own short animation, and never sticks.
let SplashScreen;
let splash;
beforeEach(() => {
  jest.useFakeTimers();
  jest.isolateModules(() => {
    jest.doMock('react', () => React);
    jest.doMock('react-native-safe-area-context', () => ({
      useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    }));
    splash = require('../src/services/splash');
    SplashScreen = require('../src/components/SplashScreen').default;
  });
});
let opened = [];
afterEach(() => {
  // Close each splash so its star timers stop with the test.
  opened.forEach(tree => act(() => tree.unmount()));
  opened = [];
  jest.useRealTimers();
});

function show(onDone) {
  let tree;
  act(() => {
    tree = ReactTestRenderer.create(<SplashScreen onDone={onDone} />);
  });
  opened.push(tree);
  return tree;
}

test('shows the app name and Pixerve credit', () => {
  const tree = show(jest.fn());
  const text = JSON.stringify(tree.toJSON());
  expect(text).toContain('ABC');
  expect(text).toContain('Kids');
  expect(text).toContain('Developed by');
  expect(text).toContain('Pixerve');
});

test('stays until Home is ready and the animation has played', () => {
  const onDone = jest.fn();
  show(onDone);
  act(() => splash.markHomeReady());
  act(() => jest.advanceTimersByTime(1500));
  expect(onDone).not.toHaveBeenCalled(); // too early
  act(() => jest.advanceTimersByTime(1000)); // minimum time passes
  act(() => jest.advanceTimersByTime(1000)); // then it fades out
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('waits for Home, but never longer than a few seconds', () => {
  const onDone = jest.fn();
  show(onDone);
  act(() => jest.advanceTimersByTime(3000));
  expect(onDone).not.toHaveBeenCalled(); // Home not ready yet
  act(() => jest.advanceTimersByTime(3500)); // the time limit passes
  act(() => jest.advanceTimersByTime(1000)); // then it fades out
  expect(onDone).toHaveBeenCalledTimes(1);
});
