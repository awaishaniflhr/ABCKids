import { gameData } from '../src/components/Games';
import {
  createTrace,
  moveTrace,
  pointOnStroke,
} from '../src/games/tracingLetters';
import { getTracingNumber, TRACING_NUMBERS } from '../src/games/tracingNumbers';
import { NUMBER_MODE } from '../src/screens/NumberTracing';

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
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

function traceAll(template) {
  let state = createTrace();
  template.strokes.forEach(stroke => {
    for (let distance = 0; distance <= stroke.length; distance += 5) {
      state = moveTrace(
        state,
        pointOnStroke(stroke, distance),
        template.strokes,
      );
    }
    state = moveTrace(
      state,
      pointOnStroke(stroke, stroke.length),
      template.strokes,
    );
  });
  return state;
}

describe('number tracing', () => {
  it('has the numbers 1 to 10 in order', () => {
    expect(TRACING_NUMBERS.map(item => item.letter)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    expect(getTracingNumber(7).letter).toBe('7');
    expect(getTracingNumber('nope').letter).toBe('1');
  });

  it.each(TRACING_NUMBERS.map(item => [item.letter, item]))(
    'can trace %s from start to finish inside the board',
    (_, template) => {
      template.strokes.forEach(stroke =>
        stroke.points.forEach(point => {
          expect(point.x).toBeGreaterThanOrEqual(40);
          expect(point.x).toBeLessThanOrEqual(360);
          expect(point.y).toBeGreaterThanOrEqual(40);
          expect(point.y).toBeLessThanOrEqual(360);
        }),
      );
      expect(traceAll(template).complete).toBe(true);
    },
  );

  it('has a word and picture for every number', () => {
    TRACING_NUMBERS.forEach(({ letter }) => {
      const lesson = NUMBER_MODE.lesson(letter);
      expect(lesson.word).toBeTruthy();
      expect(lesson.image).toBeTruthy();
    });
  });

  it('is on the home screen', () => {
    expect(gameData.find(item => item.id === 'number-tracing').screen).toBe(
      'TracingNumbers',
    );
  });
});
