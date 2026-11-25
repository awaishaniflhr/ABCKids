import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  nextUnfinished,
  readNumberTracingStars,
  readWordTracingDone,
  saveNumberTracingStar,
  saveTracingStar,
  saveWordTracingDone,
} from '../src/games/tracingProgress';
import TracingLetters from '../src/screens/TracingLetters';
import TracingNumbers from '../src/screens/TracingNumbers';
import WordTracing from '../src/screens/WordTracing';
import { TRACING_WORDS } from '../src/games/tracingWords';

let focusCallback;
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  // Run the screen's "on focus" code, as opening the screen would.
  useFocusEffect: jest.fn(callback => {
    focusCallback = callback;
  }),
}));
jest.mock('react-native-tts', () => ({
  getInitStatus: jest.fn(() => Promise.resolve()),
  setDefaultLanguage: jest.fn(() => Promise.resolve()),
  setDefaultRate: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  speak: jest.fn(),
}));
jest.mock('../src/utills/SoundPlayer', () => ({
  stop: jest.fn(),
  playSoundFile: jest.fn(),
}));
jest.mock('../src/games/tracingAudio', () => ({
  createTracingAudio: jest.fn(),
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

beforeEach(() => AsyncStorage.__reset());

const find = (screen, label) =>
  screen.root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  );

async function open(Screen, navigation, route) {
  let screen;
  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(
      <Screen navigation={navigation} route={route} />,
    );
  });
  if (focusCallback) {
    await ReactTestRenderer.act(async () => {
      focusCallback();
    });
  }
  return screen;
}

describe('saved progress', () => {
  it('works out the next unfinished item', () => {
    expect(nextUnfinished(['A', 'B', 'C', 'D'], ['A', 'B', 'C'])).toBe('D');
    expect(nextUnfinished(['A', 'B', 'C', 'D'], ['A', 'C'])).toBe('B');
    expect(nextUnfinished(['A', 'B'], [])).toBeNull();
    expect(nextUnfinished(['A', 'B'], ['A', 'B'])).toBeNull();
  });

  it('keeps each game separate, and saves numbers up to 20', async () => {
    await saveTracingStar('A');
    await saveNumberTracingStar('15');
    await saveNumberTracingStar('20');
    await saveWordTracingDone('Cat');
    expect(await readNumberTracingStars()).toEqual(['15', '20']);
    expect(await readWordTracingDone()).toEqual(['Cat']);
  });

  it('Letter Tracing: after A, B and C, Continue starts at D', async () => {
    await saveTracingStar('A');
    await saveTracingStar('B');
    await saveTracingStar('C');
    const navigation = { navigate: jest.fn(), goBack: jest.fn() };
    const screen = await open(TracingLetters, navigation);
    const [button] = find(screen, 'Continue with D');
    ReactTestRenderer.act(() => button.props.onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('LetterTracing', {
      letter: 'D',
    });
  });

  it('Letter Tracing: no Continue for a new child', async () => {
    const screen = await open(TracingLetters, { navigate: jest.fn() });
    expect(
      screen.root.findAll(node =>
        /^Continue with/.test(node.props.accessibilityLabel ?? ''),
      ),
    ).toHaveLength(0);
  });

  it('Number Tracing: Continue goes to the next unfinished number', async () => {
    for (const number of ['1', '2', '3', '4']) {
      await saveNumberTracingStar(number);
    }
    const navigation = { navigate: jest.fn(), goBack: jest.fn() };
    const screen = await open(TracingNumbers, navigation);
    const [button] = find(screen, 'Continue with 5');
    ReactTestRenderer.act(() => button.props.onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('NumberTracing', {
      number: '5',
    });
  });

  it('Word Tracing: offers to continue from the next unfinished word', async () => {
    await saveWordTracingDone(TRACING_WORDS[0].word);
    await saveWordTracingDone(TRACING_WORDS[1].word);
    const next = TRACING_WORDS[2].word;
    const screen = await open(WordTracing, { goBack: jest.fn() }, {
      params: {},
    });
    expect(find(screen, 'Start over')).toHaveLength(1);
    const [button] = find(screen, `Continue with ${next}`);
    ReactTestRenderer.act(() => button.props.onPress());
    expect(find(screen, 'Start over')).toHaveLength(0);
    expect(
      screen.root.findAll(
        node => node.props.accessibilityLabel === `Hear ${next}`,
      ).length,
    ).toBeGreaterThan(0);
  });

  it('Word Tracing: a new child goes straight to the first word', async () => {
    const screen = await open(WordTracing, { goBack: jest.fn() }, {
      params: {},
    });
    expect(find(screen, 'Start over')).toHaveLength(0);
  });
});
