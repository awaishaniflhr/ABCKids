/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {AppState} from 'react-native';
import SoundPlayer from '../src/utills/SoundPlayer';
import App from '../App';

jest.mock('../src/routes/Routes', () => () => null);
jest.mock('../src/utills/SoundPlayer', () => ({stop: jest.fn()}));
jest.mock('react-native-tts', () => ({stop: jest.fn(() => Promise.resolve())}));
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

test('renders correctly', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    app = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => app!.unmount());
});

test('stops game audio when the app goes into the background', async () => {
  const listener = jest.spyOn(AppState, 'addEventListener');
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    app = ReactTestRenderer.create(<App />);
  });
  jest.mocked(SoundPlayer.stop).mockClear();
  await ReactTestRenderer.act(() => {
    listener.mock.calls.at(-1)![1]('background');
  });
  expect(SoundPlayer.stop).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(() => app!.unmount());
  listener.mockRestore();
});
