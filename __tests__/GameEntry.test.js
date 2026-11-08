import React from 'react';
import { ImageBackground } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Letters from '../src/screens/Letters';
import Numbers from '../src/screens/Numbers';
import MemoryFlipGame from '../src/screens/MemoryFlipGame';
import Numeric from '../src/screens/Numeric';

jest.mock('react-native-animatable', () => {
  const { View, Text, Image } = require('react-native');
  return { View, Text, Image };
});
jest.mock('lottie-react-native', () => () => null);
jest.mock('react-native-orientation-locker', () => ({
  lockToPortrait: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../src/utills/SoundPlayer', () => ({ playSoundFile: jest.fn() }));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test.each([
  ['Letters', Letters],
  ['Numbers', Numbers],
  ['Memory', MemoryFlipGame],
  ['Addition', Numeric],
])(
  '%s displays game content without waiting for a loading timer',
  (_name, Screen) => {
    let screen;
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <Screen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />
        </SafeAreaProvider>,
      );
    });

    // No timer is advanced: the activity should already be on screen.
    expect(screen.root.findAllByType(ImageBackground).length).toBeGreaterThan(
      0,
    );

    ReactTestRenderer.act(() => screen.unmount());
  },
);
