import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { gameData, visibleGames } from '../src/components/Games';
import {
  createTrace,
  moveTrace,
  pointOnStroke,
} from '../src/games/tracingLetters';
import { buildWordTemplate, TRACING_WORDS } from '../src/games/tracingWords';
import WordTracing, { WORD_SUCCESS_MS } from '../src/screens/WordTracing';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  useFocusEffect: jest.fn(),
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

function traceAll(template) {
  let state = createTrace();
  template.strokes.forEach(stroke => {
    for (let distance = 0; distance <= stroke.length; distance += 5) {
      state = moveTrace(state, pointOnStroke(stroke, distance), template.strokes);
    }
    state = moveTrace(
      state,
      pointOnStroke(stroke, stroke.length),
      template.strokes,
    );
  });
  return state;
}

describe('word tracing data', () => {
  it('has one word for every letter, A to Z', () => {
    expect(TRACING_WORDS.map(item => item.word[0]).join('')).toBe(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    );
  });

  it.each(TRACING_WORDS.map(item => [item.word, item]))(
    '%s fits its board and can be traced start to finish',
    (_, template) => {
      const { box } = template;
      template.strokes.forEach(stroke =>
        stroke.points.forEach(point => {
          // Keep room for the 57-unit-thick outline inside the board.
          expect(point.x).toBeGreaterThanOrEqual(box.x + 29);
          expect(point.x).toBeLessThanOrEqual(box.x + box.width - 29);
          expect(point.y).toBeGreaterThanOrEqual(box.y + 29);
          expect(point.y).toBeLessThanOrEqual(box.y + box.height - 29);
        }),
      );
      expect(traceAll(template).complete).toBe(true);
    },
  );

  it('numbers strokes within each letter and lays letters left to right', () => {
    const template = buildWordTemplate('Dog');
    expect(template.letters.map(item => item.char)).toEqual(['D', 'o', 'g']);
    expect(template.strokes.map(stroke => stroke.number)).toEqual([
      1, 2, 1, 1, 2,
    ]);
    const lefts = template.letters.map(({ first, last }) =>
      Math.min(
        ...template.strokes
          .slice(first, last + 1)
          .flatMap(stroke => stroke.points.map(point => point.x)),
      ),
    );
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    expect(() => buildWordTemplate('D@g')).toThrow();
  });

  it('replaces Counting on the home screen', () => {
    expect(gameData.find(item => item.id === 'word-tracing').screen).toBe(
      'WordTracing',
    );
    expect(visibleGames.some(item => item.id === 'counting')).toBe(false);
  });
});

describe('word tracing screen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function mount(navigation) {
    let screen;
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(
        <WordTracing navigation={navigation} route={{ params: {} }} />,
      );
    });
    return screen;
  }
  const counter = screen =>
    screen.root
      .findAll(node => node.type === 'Text')
      .map(node => [].concat(node.props.children).join(''))
      .find(text => / \/ /.test(text));
  const press = (screen, label) =>
    ReactTestRenderer.act(() =>
      screen.root
        .find(
          node =>
            node.props.accessibilityLabel === label &&
            typeof node.props.onPress === 'function',
        )
        .props.onPress(),
    );

  it('moves between words with the arrows', () => {
    const screen = mount({ goBack: jest.fn() });
    expect(counter(screen)).toBe('1 / 26');
    press(screen, 'Next word');
    expect(counter(screen)).toBe('2 / 26');
    press(screen, 'Previous word');
    expect(counter(screen)).toBe('1 / 26');
    ReactTestRenderer.act(() => screen.unmount());
  });

  it('shows a success message and moves to the next word by itself', async () => {
    const screen = mount({ goBack: jest.fn() });
    const canvas = screen.root.find(
      node => node.props.testID === 'tracing-canvas' && node.props.onLayout,
    );
    ReactTestRenderer.act(() => {
      canvas.props.onLayout({
        nativeEvent: { layout: { width: 1200, height: 400 } },
      });
    });
    const finished = traceAll(TRACING_WORDS[0]);
    const tracing = screen.root.find(
      node => node.props.template === TRACING_WORDS[0] && node.props.onChange,
    );
    ReactTestRenderer.act(() => tracing.props.onChange(finished));
    expect(
      screen.root.findAll(node => node.props.testID === 'word-success').length,
    ).toBeGreaterThan(0);
    expect(counter(screen)).toBe('1 / 26');
    // The finished word is saved straight away, so it's kept if the app closes.
    await ReactTestRenderer.act(async () => {});
    expect(
      require('@react-native-async-storage/async-storage').default.setItem,
    ).toHaveBeenCalledWith(
      '@abckids/word-tracing/v1/done',
      JSON.stringify([TRACING_WORDS[0].word]),
    );
    ReactTestRenderer.act(() => jest.advanceTimersByTime(WORD_SUCCESS_MS));
    expect(counter(screen)).toBe('2 / 26');
    expect(
      screen.root.findAll(node => node.props.testID === 'word-success').length,
    ).toBe(0);
    ReactTestRenderer.act(() => screen.unmount());
  });

  it('goes home from the Home button', () => {
    const navigation = { goBack: jest.fn() };
    const screen = mount(navigation);
    press(screen, 'Home');
    expect(navigation.goBack).toHaveBeenCalled();
    ReactTestRenderer.act(() => screen.unmount());
  });
});
