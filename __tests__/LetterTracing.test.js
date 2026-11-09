import React from 'react';
import { AccessibilityInfo, AppState, Dimensions, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LetterTracing, {
  TRACING_SUCCESS_MS,
} from '../src/screens/LetterTracing';
import { createTracingAudio } from '../src/games/tracingAudio';
import TracingLetters from '../src/screens/TracingLetters';
import { gameData } from '../src/components/Games';
import {
  beginTrace,
  canvasGeometry,
  canvasPoint,
  createTrace,
  getTracingLetter,
  moveTrace,
  pauseTrace,
  pointOnStroke,
  TRACING_LETTERS,
} from '../src/games/tracingLetters';
import {
  readTracingStars,
  saveTracingStar,
} from '../src/games/tracingProgress';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
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
  createTracingAudio: jest.fn(() => ({
    move: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    celebrate: jest.fn(),
    release: jest.fn(),
  })),
}));
jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map();
  return {
    getItem: jest.fn(async key => data.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      data.set(key, value);
    }),
    clear: jest.fn(async () => data.clear()),
  };
});

function finishStroke(state, template) {
  const index = state.strokeIndex;
  const stroke = template.strokes[index];
  state = beginTrace(state, stroke.points[0], template.strokes);
  for (const point of stroke.points.slice(1)) {
    state = moveTrace(state, point, template.strokes);
    if (state.strokeIndex !== index) break;
  }
  return state;
}

test.each(TRACING_LETTERS)(
  '$letter can be fully traced in stroke order without skipping a region',
  template => {
    let state = createTrace();
    for (let index = 0; index < template.strokes.length; index++) {
      expect(state.complete).toBe(false);
      const stroke = template.strokes[index];
      expect(stroke.length).toBeGreaterThan(40);
      expect(
        stroke.points.every(
          point =>
            point.x >= 45 && point.x <= 355 && point.y >= 45 && point.y <= 355,
        ),
      ).toBe(true);
      state = finishStroke(state, template);
      expect(state.strokeIndex).toBe(index + 1);
    }
    expect(state.complete).toBe(true);
  },
);

test('rejects starting in the middle, tracing backward, and tapping an endpoint', () => {
  const { strokes } = getTracingLetter('A');
  const first = strokes[0];
  expect(
    beginTrace(createTrace(), pointOnStroke(first, first.length / 2), strokes)
      .drawing,
  ).toBe(false);
  let state = beginTrace(createTrace(), first.points.at(-1), strokes);
  expect(state.progress).toBe(0);
  state = moveTrace(state, first.points[0], strokes);
  expect(state.complete).toBe(false);
  expect(state.strokeIndex).toBe(0);
  expect(state.progress).toBe(0);
});

test('going outside the outline pauses progress and the child can resume from the checkpoint', () => {
  const template = getTracingLetter('I');
  let state = beginTrace(createTrace(), { x: 200, y: 80 }, template.strokes);
  state = moveTrace(state, { x: 200, y: 180 }, template.strokes);
  expect(state.progress).toBeCloseTo(100);
  const checkpoint = state.progress;
  state = moveTrace(state, { x: 340, y: 180 }, template.strokes);
  expect(state).toMatchObject({
    offTrack: true,
    drawing: false,
    strokeIndex: 0,
  });
  expect(state.progress).toBeCloseTo(checkpoint);
  state = beginTrace(state, { x: 200, y: 180 }, template.strokes);
  state = moveTrace(state, { x: 200, y: 320 }, template.strokes);
  expect(state.strokeIndex).toBe(1);
});

test.each(['C', 'O', 'S', 'Z'])(
  'a shortcut between endpoints cannot complete %s',
  letter => {
    const template = getTracingLetter(letter);
    const stroke = template.strokes[0];
    let state = beginTrace(createTrace(), stroke.points[0], template.strokes);
    state = moveTrace(state, stroke.points.at(-1), template.strokes);
    expect(state.strokeIndex).toBe(0);
    expect(state.complete).toBe(false);
  },
);

test.each([
  [320, 540],
  [780, 230],
  [1000, 650],
])(
  'maps touch coordinates to the letter in a %i x %i canvas',
  (width, height) => {
    const geometry = canvasGeometry(width, height);
    const touch = {
      x: geometry.left + 200 * geometry.scale,
      y: geometry.top + 80 * geometry.scale,
    };
    const mapped = canvasPoint(touch, width, height);
    expect(mapped.x).toBeCloseTo(200);
    expect(mapped.y).toBeCloseTo(80);
  },
);

test('pausing a trace keeps its checkpoint and the chosen letter fallback is safe', () => {
  const template = getTracingLetter('a');
  const state = moveTrace(
    beginTrace(createTrace(), template.strokes[0].points[0], template.strokes),
    template.strokes[0].points[8],
    template.strokes,
  );
  expect(pauseTrace(state)).toMatchObject({
    progress: state.progress,
    drawing: false,
  });
  expect(getTracingLetter('unknown').letter).toBe('A');
});

describe('tracing screens', () => {
  let screen;
  let navigation;
  const originalWindow = Dimensions.get('window');
  const viewport = (width, height) => {
    const metrics = { width, height, scale: 1, fontScale: 1 };
    Dimensions.set({ window: metrics, screen: metrics });
  };
  beforeEach(async () => {
    jest.useFakeTimers({ now: 0 });
    createTracingAudio.mockClear();
    await AsyncStorage.clear();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    navigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setParams: jest.fn(),
    };
    viewport(393, 873);
  });
  afterEach(async () => {
    if (screen) await ReactTestRenderer.act(async () => screen.unmount());
    screen = undefined;
    jest.restoreAllMocks();
    jest.useRealTimers();
    Dimensions.set({ window: originalWindow, screen: originalWindow });
  });
  const button = label =>
    screen.root.findAll(
      node =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    )[0];
  const canvas = () => screen.root.findByProps({ testID: 'tracing-canvas' });
  function event(point, identifier = 0) {
    const contact = { identifier, locationX: point.x, locationY: point.y };
    return {
      nativeEvent: {
        ...contact,
        touches: [contact],
        changedTouches: [contact],
      },
    };
  }
  async function mount(letter = 'A') {
    await ReactTestRenderer.act(async () => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <LetterTracing
            navigation={navigation}
            route={{ params: { letter } }}
          />
        </SafeAreaProvider>,
      );
    });
    await ReactTestRenderer.act(async () =>
      canvas().props.onLayout({
        nativeEvent: { layout: { width: 400, height: 400 } },
      }),
    );
  }
  async function drawStroke(stroke) {
    await ReactTestRenderer.act(async () => {
      canvas().props.onResponderGrant(event(stroke.points[0]));
      for (const point of stroke.points.slice(1))
        canvas().props.onResponderMove(event(point));
      canvas().props.onResponderRelease();
    });
  }
  async function finishLetter(letter) {
    for (const stroke of getTracingLetter(letter).strokes)
      await drawStroke(stroke);
  }

  test('only forward tracing movement starts audio, and lift or leaving the path stops it', async () => {
    await mount('I');
    const audio = createTracingAudio.mock.results.at(-1).value;
    audio.stop.mockClear();
    await ReactTestRenderer.act(async () =>
      canvas().props.onResponderGrant(event({ x: 200, y: 80 })),
    );
    expect(audio.move).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () =>
      canvas().props.onResponderMove(event({ x: 200, y: 120 })),
    );
    expect(audio.move).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () =>
      canvas().props.onResponderMove(event({ x: 200, y: 120 })),
    );
    expect(audio.stop).toHaveBeenCalled();
    audio.stop.mockClear();
    await ReactTestRenderer.act(async () =>
      canvas().props.onResponderMove(event({ x: 350, y: 120 })),
    );
    expect(audio.stop).toHaveBeenCalled();
    audio.stop.mockClear();
    await ReactTestRenderer.act(async () =>
      canvas().props.onResponderRelease(),
    );
    expect(audio.stop).toHaveBeenCalled();
  });

  test('celebrates a completed letter before automatically opening the next one', async () => {
    await mount();
    await finishLetter('A');
    expect(
      screen.root.findAllByProps({ testID: 'tracing-success' }).length,
    ).toBeGreaterThan(0);
    expect(
      createTracingAudio.mock.results.at(-1).value.celebrate,
    ).toHaveBeenCalledTimes(1);
    expect(navigation.setParams).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () =>
      jest.advanceTimersByTime(TRACING_SUCCESS_MS - 1),
    );
    expect(navigation.setParams).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => jest.advanceTimersByTime(1));
    expect(navigation.setParams).toHaveBeenCalledTimes(1);
    expect(navigation.setParams).toHaveBeenCalledWith({ letter: 'B' });
  });

  test('pauses the success countdown in the background and resumes the time left', async () => {
    const listener = jest.spyOn(AppState, 'addEventListener');
    listener.mockClear();
    await mount();
    const onState = listener.mock.calls.find(([name]) => name === 'change')[1];
    const audio = createTracingAudio.mock.results.at(-1).value;
    await finishLetter('A');
    await ReactTestRenderer.act(async () => jest.advanceTimersByTime(1000));
    await ReactTestRenderer.act(async () => onState('background'));
    expect(audio.release).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => jest.advanceTimersByTime(60000));
    expect(navigation.setParams).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => onState('active'));
    await ReactTestRenderer.act(async () =>
      jest.advanceTimersByTime(TRACING_SUCCESS_MS - 1001),
    );
    expect(navigation.setParams).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => jest.advanceTimersByTime(1));
    expect(navigation.setParams).toHaveBeenCalledWith({ letter: 'B' });
  });

  test('manual Next cancels automatic Next so a letter is never skipped', async () => {
    await mount();
    await finishLetter('A');
    await ReactTestRenderer.act(async () =>
      button('Next letter').props.onPress(),
    );
    await ReactTestRenderer.act(async () =>
      jest.advanceTimersByTime(TRACING_SUCCESS_MS * 2),
    );
    expect(navigation.setParams).toHaveBeenCalledTimes(1);
  });

  test('restarting or leaving the screen cancels a pending transition and cleans up audio', async () => {
    await mount();
    await finishLetter('A');
    await ReactTestRenderer.act(async () =>
      button('Start again').props.onPress(),
    );
    await ReactTestRenderer.act(async () =>
      jest.advanceTimersByTime(TRACING_SUCCESS_MS),
    );
    expect(navigation.setParams).not.toHaveBeenCalled();
    await finishLetter('A');
    const audio = createTracingAudio.mock.results.at(-1).value;
    await ReactTestRenderer.act(async () => screen.unmount());
    screen = undefined;
    await ReactTestRenderer.act(async () =>
      jest.advanceTimersByTime(TRACING_SUCCESS_MS),
    );
    expect(navigation.setParams).not.toHaveBeenCalled();
    expect(audio.release).toHaveBeenCalledTimes(1);
  });

  test('finishing Z celebrates before returning to the alphabet gallery', async () => {
    await mount('Z');
    await finishLetter('Z');
    expect(navigation.goBack).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () =>
      jest.advanceTimersByTime(TRACING_SUCCESS_MS),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.setParams).not.toHaveBeenCalled();
  });

  test('has its own home entry and does not change the existing Letters destination', async () => {
    expect(gameData.find(item => item.id === 'letters').screen).toBe('Letters');
    expect(gameData.find(item => item.id === 'tracing').screen).toBe(
      'TracingLetters',
    );
    await ReactTestRenderer.act(async () => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <TracingLetters navigation={navigation} />
        </SafeAreaProvider>,
      );
    });
    await ReactTestRenderer.act(async () =>
      button('Trace letter A').props.onPress(),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('LetterTracing', {
      letter: 'A',
    });
  });

  test('only awards a star and enables Next after every stroke is actually traced', async () => {
    await mount();
    const template = getTracingLetter('A');
    expect(button('Next letter').props.disabled).toBe(true);
    await drawStroke(template.strokes[0]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(button('Next letter').props.disabled).toBe(true);
    await drawStroke(template.strokes[1]);
    await drawStroke(template.strokes[2]);
    expect(button('Next letter').props.disabled).toBe(false);
    expect(button('Hear A for Apple')).toBeDefined();
    expect(await readTracingStars()).toEqual(['A']);
    await ReactTestRenderer.act(async () =>
      button('Next letter').props.onPress(),
    );
    expect(navigation.setParams).toHaveBeenCalledWith({ letter: 'B' });
    await ReactTestRenderer.act(async () =>
      button('Start again').props.onPress(),
    );
    expect(button('Next letter').props.disabled).toBe(true);
    expect(
      screen.root.findAllByProps({ testID: 'traced-stroke-0' }),
    ).toHaveLength(0);
  });

  test('changing paint and rotating keep the letter progress; another finger cannot paint', async () => {
    await mount();
    await ReactTestRenderer.act(async () =>
      button('Use blue paint').props.onPress(),
    );
    await drawStroke(getTracingLetter('A').strokes[0]);
    const painted = () =>
      screen.root.findAll(
        node => node.props.testID === 'traced-stroke-0' && node.props.stroke,
      )[0];
    expect(painted().props.stroke).toBe('#48A9E3');
    await ReactTestRenderer.act(async () => viewport(873, 393));
    expect(painted().props.strokeDashoffset).toBe(0);
    expect(button('Use blue paint').props.accessibilityState.selected).toBe(
      true,
    );
    const next = getTracingLetter('A').strokes[1];
    await ReactTestRenderer.act(async () => {
      canvas().props.onResponderGrant(event(next.points[0]));
      canvas().props.onResponderMove(event(next.points.at(-1), 1));
      canvas().props.onResponderRelease();
    });
    expect(
      screen.root.findAllByProps({ testID: 'traced-stroke-1' }),
    ).toHaveLength(0);
    expect(button('Next letter').props.disabled).toBe(true);
  });

  test('backgrounding cancels an active gesture without losing completed strokes', async () => {
    const listener = jest.spyOn(AppState, 'addEventListener');
    listener.mockClear();
    await mount('I');
    const stroke = getTracingLetter('I').strokes[0];
    await drawStroke(stroke);
    const paintedBefore = screen.root.findAllByProps({
      testID: 'traced-stroke-0',
    }).length;
    await ReactTestRenderer.act(async () =>
      listener.mock.calls.find(([name]) => name === 'change')[1]('background'),
    );
    expect(canvas().props.onStartShouldSetResponder()).toBe(false);
    expect(
      screen.root.findAllByProps({ testID: 'traced-stroke-0' }),
    ).toHaveLength(paintedBefore);
  });

  test('merges saved stars from quick completions and ignores corrupt storage', async () => {
    await Promise.all([
      saveTracingStar('A'),
      saveTracingStar('B'),
      saveTracingStar('A'),
    ]);
    expect(await readTracingStars()).toEqual(['A', 'B']);
    AsyncStorage.getItem.mockResolvedValueOnce('invalid json');
    expect(await readTracingStars()).toEqual([]);
  });

  test.each([
    [320, 568],
    [568, 320],
    [1280, 800],
  ])('renders the game and its controls at %i x %i', async (width, height) => {
    viewport(width, height);
    await mount('Z');
    expect(button('Previous')).toBeDefined();
    expect(button('Show me')).toBeDefined();
    expect(button('All letters').props.disabled).toBe(true);
    expect(screen.root.findAllByType(Text).length).toBeGreaterThan(0);
  });
});
