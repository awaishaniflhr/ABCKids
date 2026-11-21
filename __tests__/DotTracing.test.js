import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Circle } from 'react-native-svg';
import { visibleGames } from '../src/components/Games';
import {
  createDotTrace,
  DOT_BOX,
  DOT_LETTERS,
  DOT_RADIUS,
  drawDots,
} from '../src/games/dotTracing';
import { TRACING_LETTERS } from '../src/games/tracingLetters';
import DotTracing, {
  dotLesson,
  DOT_SUCCESS_MS,
} from '../src/screens/DotTracing';

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

const RADIUS = 26;
const dotsOf = letter => letter.strokes.flatMap(stroke => stroke.dots);
// Draws one pen line through the dots of a stroke, in order.
function penThrough(state, letter, dots) {
  let next = state;
  let last = null;
  dots.forEach(dot => {
    next = drawDots(next, letter, last, dot, RADIUS);
    last = dot;
  });
  return next;
}

describe('dot letters', () => {
  it('covers A to Z', () => {
    expect(DOT_LETTERS.map(item => item.letter).join('')).toBe(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    );
  });

  it.each(DOT_LETTERS.map(item => [item.letter, item]))(
    '%s keeps its dots and arrows on the board and can be finished',
    (_, letter) => {
      const inside = (point, margin) => {
        expect(point.x).toBeGreaterThanOrEqual(DOT_BOX.x + margin);
        expect(point.x).toBeLessThanOrEqual(DOT_BOX.x + DOT_BOX.width - margin);
        expect(point.y).toBeGreaterThanOrEqual(DOT_BOX.y + margin);
        expect(point.y).toBeLessThanOrEqual(
          DOT_BOX.y + DOT_BOX.height - margin,
        );
      };
      dotsOf(letter).forEach(dot => inside(dot, DOT_RADIUS));
      letter.strokes.forEach(stroke => inside(stroke.arrow, 13));
      // Every stroke keeps the same count of strokes as its guide (no stroke
      // lost to shared dots), and no two dots sit on top of each other.
      expect(letter.strokes).toHaveLength(
        TRACING_LETTERS.find(item => item.letter === letter.letter).strokes
          .length,
      );
      const dots = dotsOf(letter);
      dots.forEach((a, i) =>
        dots.slice(i + 1).forEach(b => {
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(DOT_RADIUS);
        }),
      );
      let state = createDotTrace();
      letter.strokes.forEach(stroke => {
        state = penThrough(state, letter, stroke.dots);
      });
      expect(state.complete).toBe(true);
    },
  );

  it('ignores scribbles away from the letter', () => {
    const letter = DOT_LETTERS[0];
    let state = createDotTrace();
    state = drawDots(
      state,
      letter,
      { x: 30, y: 30 },
      { x: 370, y: 30 },
      RADIUS,
    );
    state = drawDots(
      state,
      letter,
      { x: 30, y: 360 },
      { x: 60, y: 200 },
      RADIUS,
    );
    expect(state).toEqual(createDotTrace());
  });

  it('fills strokes in order', () => {
    const letter = DOT_LETTERS.find(item => item.letter === 'T');
    const second = letter.strokes[1].dots;
    // The stem (stroke 2) shares no dots with the bar; drawing it first
    // lights nothing.
    let state = penThrough(createDotTrace(), letter, second.slice(1));
    expect(state).toEqual(createDotTrace());
    state = penThrough(state, letter, letter.strokes[0].dots);
    expect(state).toMatchObject({ strokeIndex: 1, filled: 0 });
  });

  it('has a word and picture for every letter, including W', () => {
    DOT_LETTERS.forEach(({ letter }) => {
      const lesson = dotLesson(letter);
      expect(lesson.word).not.toBe(letter);
      expect(lesson.image).toBeTruthy();
    });
    expect(dotLesson('W').word).toBe('Wolf');
  });

  it('is on the home screen', () => {
    expect(visibleGames.find(item => item.id === 'dot-tracing').screen).toBe(
      'DotTracing',
    );
  });
});

describe('dot tracing screen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const counter = screen =>
    screen.root
      .findAll(node => node.type === 'Text')
      .map(node => [].concat(node.props.children).join(''))
      .find(text => / \/ /.test(text));
  const board = screen =>
    screen.root.find(
      node => node.props.testID === 'dot-board' && node.props.onLayout,
    );
  const filledDots = screen =>
    screen.root.findAll(
      node => node.type === Circle && node.props.testID === 'dot-filled',
    ).length;

  it('fills dots under the pen, celebrates, then moves on', () => {
    let screen;
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(
        <DotTracing navigation={{ goBack: jest.fn() }} route={{}} />,
      );
    });
    expect(counter(screen)).toBe('1 / 26');
    // A square 360 x 364 layout maps canvas units ~1:1 to touch points.
    ReactTestRenderer.act(() =>
      board(screen).props.onLayout({
        nativeEvent: {
          layout: { width: DOT_BOX.width, height: DOT_BOX.height },
        },
      }),
    );
    const at = point => ({
      nativeEvent: {
        locationX: point.x - DOT_BOX.x,
        locationY: point.y - DOT_BOX.y,
        identifier: 0,
        touches: [
          {
            locationX: point.x - DOT_BOX.x,
            locationY: point.y - DOT_BOX.y,
            identifier: 0,
          },
        ],
      },
    });
    DOT_LETTERS[0].strokes.forEach((stroke, strokeIndex) => {
      ReactTestRenderer.act(() =>
        board(screen).props.onResponderGrant(at(stroke.dots[0])),
      );
      stroke.dots.forEach(dot =>
        ReactTestRenderer.act(() =>
          board(screen).props.onResponderMove(at(dot)),
        ),
      );
      ReactTestRenderer.act(() => board(screen).props.onResponderRelease());
      if (strokeIndex === 0) {
        expect(filledDots(screen)).toBe(stroke.dots.length);
      }
    });
    expect(filledDots(screen)).toBe(dotsOf(DOT_LETTERS[0]).length);
    expect(
      screen.root.findAll(node => node.props.testID === 'word-success').length,
    ).toBeGreaterThan(0);
    ReactTestRenderer.act(() => jest.advanceTimersByTime(DOT_SUCCESS_MS));
    expect(counter(screen)).toBe('2 / 26');
    expect(filledDots(screen)).toBe(0);
    ReactTestRenderer.act(() => screen.unmount());
  });
});
