import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  answerOptions,
  chooseAnswer,
  EASY_MAX,
  EASY_QUESTIONS,
  makeQuestion,
  MAX_SUM,
  STREAK_CHEER,
} from '../src/games/addition';
import Numeric, { NEXT_QUESTION_MS } from '../src/screens/Numeric';

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
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// A small seeded generator so the "random" tests are repeatable.
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

describe('addition questions', () => {
  it('keeps sums small and countable', () => {
    const rng = seeded(7);
    for (let run = 0; run < 400; run++) {
      const number = run % 30;
      const question = makeQuestion(number, rng);
      const sum = question.a + question.b;
      expect(question.a).toBeGreaterThanOrEqual(1);
      expect(question.b).toBeGreaterThanOrEqual(1);
      expect(sum).toBeLessThanOrEqual(
        number < EASY_QUESTIONS ? EASY_MAX : MAX_SUM,
      );
    }
  });

  it('always offers three different answers including the right one', () => {
    const rng = seeded(11);
    for (let sum = 2; sum <= MAX_SUM; sum++) {
      const options = answerOptions(sum, rng);
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
      expect(options).toContain(sum);
      options.forEach(value => expect(value).toBeGreaterThanOrEqual(1));
    }
  });

  it('does not repeat the same sum or fruit twice in a row', () => {
    const first = makeQuestion(3, () => 0.5);
    const second = makeQuestion(4, () => 0.5, first);
    expect([second.a, second.b]).not.toEqual([first.a, first.b]);
    expect(second.fruit).not.toBe(first.fruit);
  });

  it('remembers wrong tries and whether it was right first time', () => {
    const question = { ...makeQuestion(0), a: 2, b: 1, options: [2, 3, 4] };
    const missed = chooseAnswer(question, 4);
    expect(missed).toMatchObject({ wrong: [4], firstTry: false, answer: null });
    expect(chooseAnswer(missed, 4)).toBe(missed);
    expect(chooseAnswer(missed, 3)).toMatchObject({
      answer: 3,
      firstTry: false,
    });
    expect(chooseAnswer(question, 3).firstTry).toBe(true);
  });
});

describe('addition screen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  let screen;
  const text = () =>
    screen.root
      .findAllByType(Text)
      .map(node => [].concat(node.props.children).join(''))
      .join(' ');
  const press = label =>
    ReactTestRenderer.act(() =>
      screen.root
        .findAll(
          node =>
            node.props.accessibilityLabel === label &&
            typeof node.props.onPress === 'function',
        )[0]
        .props.onPress(),
    );
  const current = () => {
    const match = text().match(/(\d+) \+ (\d+) = \?/);
    return { a: Number(match[1]), b: Number(match[2]) };
  };

  const pill = label =>
    screen.root.findAll(node => node.props.accessibilityLabel === label)
      .length > 0;

  it('keeps asking new questions without ever ending', () => {
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <Numeric navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />
        </SafeAreaProvider>,
      );
    });
    const QUESTIONS = 3 * STREAK_CHEER;
    for (let round = 0; round < QUESTIONS; round++) {
      const { a, b } = current();
      if (round === 0) {
        // A wrong answer first: it is crossed out and the helper nudges.
        const wrong = screen.root
          .findAll(
            node =>
              /^\d+$/.test(node.props.accessibilityLabel || '') &&
              typeof node.props.onPress === 'function',
          )
          .map(node => Number(node.props.accessibilityLabel))
          .find(value => value !== a + b);
        press(String(wrong));
        expect(text()).toContain('Oops!');
        expect(text()).toContain(`${a} + ${b} = ?`);
      }
      press(String(a + b));
      expect(text()).toContain(`${a} + ${b} = ${a + b}`);
      expect(pill(`${round + 1} stars`)).toBe(true);
      // The first sum needed a second try, so the streak starts after it.
      if (round >= 2) expect(pill(`${round} in a row`)).toBe(true);
      if (round === STREAK_CHEER) {
        expect(text()).toContain(`${STREAK_CHEER} in a row! Superstar!`);
      }
      ReactTestRenderer.act(() => jest.advanceTimersByTime(NEXT_QUESTION_MS));
      expect(text()).toMatch(/\d+ \+ \d+ = \?/);
    }
    expect(
      screen.root.findAll(node => node.props.testID === 'activity-result'),
    ).toHaveLength(0);
    ReactTestRenderer.act(() => screen.unmount());
  });

  it('counts fruit when tapped', () => {
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <Numeric navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />
        </SafeAreaProvider>,
      );
    });
    // Give the plates a size so the fruit appear.
    screen.root
      .findAll(node => node.props.onLayout && node.props.style)
      .forEach(node =>
        ReactTestRenderer.act(() =>
          node.props.onLayout({
            nativeEvent: { layout: { width: 200, height: 200 } },
          }),
        ),
      );
    const fruit = screen.root.findAll(
      node =>
        /^Count .+ \d+$/.test(node.props.accessibilityLabel || '') &&
        typeof node.props.onPress === 'function',
    );
    const { a, b } = current();
    expect(fruit).toHaveLength(a + b);
    ReactTestRenderer.act(() => fruit[fruit.length - 1].props.onPress());
    ReactTestRenderer.act(() => fruit[0].props.onPress());
    ReactTestRenderer.act(() => fruit[0].props.onPress()); // no double count
    const badges = screen.root
      .findAllByType(Text)
      .map(node => [].concat(node.props.children).join(''))
      .filter(value => value === '1' || value === '2');
    expect(badges).toEqual(expect.arrayContaining(['1', '2']));
    ReactTestRenderer.act(() => screen.unmount());
  });
});
