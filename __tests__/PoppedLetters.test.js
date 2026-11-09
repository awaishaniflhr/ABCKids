import React from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import BalloonPopping from '../src/screens/BalloonPopping';
import {
  createRound,
  getDifficulty,
  getDistractorLetters,
  getBalloonY,
  findBalloonAtPoint,
  roundReducer,
  MAX_BALLOONS,
  ROUND_SECONDS,
  SPAWN_INTERVAL,
  BALLOON_TOUCH_PADDING,
} from '../src/games/poppedLetters';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
}));
jest.mock('react-native-orientation-locker', () => ({
  lockToLandscape: jest.fn(),
}));
jest.mock('react-native-tts', () => ({
  getInitStatus: jest.fn(() => Promise.resolve()),
  setDefaultLanguage: jest.fn(() => Promise.resolve()),
  setDefaultRate: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  speak: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/utills/SoundPlayer', () => ({
  stop: jest.fn(),
  playSoundFile: jest.fn(),
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

function spawn(state, id, isBomb = false) {
  return roundReducer(state, {
    type: 'spawn',
    roundId: state.roundId,
    balloon: { id, isBomb, isTarget: !isBomb },
  });
}

test('scores each balloon once, penalizes bombs, and never makes the score negative', () => {
  let state = spawn(createRound(), 'letter');
  state = roundReducer(state, { type: 'pop', roundId: 0, id: 'letter' });
  expect(state.score).toBe(1);
  expect(roundReducer(state, { type: 'pop', roundId: 0, id: 'letter' })).toBe(
    state,
  );
  for (const id of ['bomb-one', 'bomb-two']) {
    state = spawn(state, id, true);
    state = roundReducer(state, { type: 'pop', roundId: 0, id });
  }
  expect(state.score).toBe(0);
});

test('bounds the live balloon count and removes expired balloons', () => {
  let state = createRound();
  for (let index = 0; index < 100; index++) {
    state = spawn(state, `${index}`);
  }
  expect(state.balloons).toHaveLength(MAX_BALLOONS);
  state = roundReducer(state, { type: 'expire', roundId: 0, id: '0' });
  expect(state.balloons).toHaveLength(MAX_BALLOONS - 1);
});

test('bombs break a streak while keeping the best streak for the result', () => {
  let state = createRound();
  for (const id of ['a', 'b', 'c']) {
    state = spawn(state, id);
    state = roundReducer(state, { type: 'pop', roundId: 0, id });
  }
  expect(state).toMatchObject({ streak: 3, bestStreak: 3, bombHits: 0 });
  state = spawn(state, 'bomb', true);
  state = roundReducer(state, { type: 'pop', roundId: 0, id: 'bomb' });
  expect(state).toMatchObject({
    score: 2,
    streak: 0,
    bestStreak: 3,
    bombHits: 1,
  });
  expect(roundReducer(state, { type: 'reset' })).toEqual(createRound(1));
});

test('the final eight seconds increase bomb frequency and flight speed', () => {
  const early = getDifficulty(9);
  const rush = getDifficulty(8);
  expect(early.bombChance).toBeGreaterThan(0.1);
  expect(rush.bombChance).toBeLessThanOrEqual(0.25);
  expect(rush.bombChance).toBeGreaterThan(early.bombChance);
  expect(rush.flightMs).toBeLessThan(early.flightMs);
});

test('ignores late callbacks from a completed or replayed round', () => {
  const playing = spawn(createRound(), 'old-balloon');
  const finished = roundReducer(playing, { type: 'finish', roundId: 0 });
  expect(finished.status).toBe('lost');
  expect(
    roundReducer(finished, { type: 'pop', roundId: 0, id: 'old-balloon' }),
  ).toBe(finished);
  const replayed = roundReducer(finished, { type: 'reset' });
  expect(replayed).toEqual(createRound(1));
  expect(roundReducer(replayed, { type: 'finish', roundId: 0 })).toBe(replayed);
});

test('clears old balloon positions after a resize while preserving the score and time', () => {
  const state = {
    ...spawn(createRound(), 'old-position'),
    score: 3,
    timeLeft: 12,
  };
  expect(roundReducer(state, { type: 'resize', roundId: 0 })).toEqual({
    ...state,
    balloons: [],
  });
});

test('uses just two distinct extra letters for every selected letter, including Z', () => {
  for (const target of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const distractors = getDistractorLetters(target);
    expect(distractors).toHaveLength(2);
    expect(new Set([target, ...distractors]).size).toBe(3);
    expect(distractors.every(letter => /^[A-Z]$/.test(letter))).toBe(true);
  }
  expect(getDistractorLetters('Z')).toEqual(['A', 'B']);
});

test('a wrong letter gives no points or bomb penalty and is removed only once', () => {
  let state = spawn(createRound(), 'correct');
  state = roundReducer(state, { type: 'pop', roundId: 0, id: 'correct' });
  state = roundReducer(state, {
    type: 'spawn',
    roundId: 0,
    balloon: { id: 'wrong', isBomb: false, isTarget: false, letter: 'B' },
  });
  state = roundReducer(state, { type: 'pop', roundId: 0, id: 'wrong' });
  expect(state).toMatchObject({
    score: 1,
    bombHits: 0,
    lastPop: { isTarget: false, isBomb: false },
    balloons: [],
  });
  expect(roundReducer(state, { type: 'pop', roundId: 0, id: 'wrong' })).toBe(state);
});

test('moving touch targets follow the flight, pause position, and letter padding', () => {
  const balloon = { id: 'a', x: 40, size: 80, isBomb: false };
  const motion = { startY: 300, endY: -80, duration: 4000, startedAt: 1000 };
  const motions = new Map([['a', motion]]);
  expect(getBalloonY(motion, 3000)).toBe(110);
  expect(getBalloonY(motion, 999)).toBe(300);
  expect(getBalloonY(motion, 6000)).toBe(-80);
  const paused = { ...motion, startY: 110, duration: 2000, startedAt: 6000 };
  expect(getBalloonY(paused, 7000)).toBe(15);
  // At this time the original spawn bounds are nowhere near the finger.
  expect(
    findBalloonAtPoint([balloon], motions, { x: 130, y: 150 }, 3000, new Set()),
  ).toBe(balloon);
  expect(
    findBalloonAtPoint([balloon], motions, { x: 80, y: 340 }, 3000, new Set()),
  ).toBeNull();
  expect(
    findBalloonAtPoint([balloon], motions, { x: 80, y: 150 }, 3000, new Set(['a'])),
  ).toBeNull();
});

test('a bomb has no extra hit area and takes priority over nearby letter padding', () => {
  const letter = { id: 'letter', x: 0, size: 80, isBomb: false };
  const bomb = { id: 'bomb', x: 90, size: 80, isBomb: true };
  const motion = { startY: 100, endY: -80, duration: 4000, startedAt: 1000 };
  const motions = new Map([['letter', motion], ['bomb', motion]]);
  expect(
    findBalloonAtPoint([bomb, letter], motions, { x: 95, y: 140 }, 1000, new Set()),
  ).toBe(bomb);
  expect(
    findBalloonAtPoint([bomb], motions, { x: 180, y: 140 }, 1000, new Set()),
  ).toBeNull();
});

describe('balloon screen', () => {
  let screen;
  let stateListener;
  let timing;

  beforeEach(() => {
    jest.useFakeTimers({ now: 0 });
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    useIsFocused.mockReturnValue(true);
    stateListener = jest.spyOn(AppState, 'addEventListener');
    stateListener.mockClear();
    timing = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    }));
  });

  afterEach(() => {
    if (screen) {
      ReactTestRenderer.act(() => screen.unmount());
      screen = undefined;
    }
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function tree(route = { params: { Letter: 'A' } }) {
    return (
      <SafeAreaProvider>
        <BalloonPopping navigation={{ goBack: jest.fn() }} route={route} />
      </SafeAreaProvider>
    );
  }

  function mount(route) {
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(tree(route));
    });
    ReactTestRenderer.act(() => {
      screen.root.findByProps({ testID: 'balloon-play-area' }).props.onLayout({
        nativeEvent: { layout: { width: 720, height: 260 } },
      });
    });
  }

  function buttons(label) {
    return screen.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    );
  }

  function hasLabel(label) {
    return screen.root.findAllByProps({ accessibilityLabel: label }).length > 0;
  }

  test('renders a usable game with missing route parameters and native-driven movement', () => {
    mount({});
    expect(buttons('Pop A balloon').length).toBeGreaterThan(0);
    expect(
      StyleSheet.flatten(screen.root.findAllByType(Image)[0].props.style),
    ).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
    });
    expect(timing.mock.calls[0][1]).toMatchObject({
      useNativeDriver: true,
      isInteraction: false,
    });
  });

  test('reaches the win state and the replay button starts a clean round', () => {
    mount();
    for (let index = 0; index < 10; index++) {
      while (buttons('Pop A balloon').length === 0 && Date.now() < 15000) {
        ReactTestRenderer.act(() => jest.advanceTimersByTime(SPAWN_INTERVAL));
      }
      ReactTestRenderer.act(() => buttons('Pop A balloon')[0].props.onPress());
    }
    expect(hasLabel('Score 10 of 10')).toBe(true);
    ReactTestRenderer.act(() =>
      jest.advanceTimersByTime(ROUND_SECONDS * 1000 - Date.now()),
    );
    expect(
      screen.root.findAll(node => node.props.children === 'You did it!').length,
    ).toBeGreaterThan(0);
    ReactTestRenderer.act(() => buttons('Play again')[0].props.onPress());
    expect(hasLabel('Score 0 of 10')).toBe(true);
    expect(hasLabel('20 seconds left')).toBe(true);
    expect(buttons('Pop A balloon').length).toBeGreaterThan(0);
  });

  test('pops on touch-down and ignores release or repeated events for the same balloon', () => {
    mount();
    ReactTestRenderer.act(() => jest.advanceTimersByTime(SPAWN_INTERVAL));
    const [first, second] = buttons('Pop A balloon');
    ReactTestRenderer.act(() => {
      first.props.onPressIn();
      first.props.onPress();
      first.props.onPressIn();
      second.props.onPressIn();
      second.props.onPress();
    });
    expect(hasLabel('Score 2 of 10')).toBe(true);
    expect(buttons('Pop A balloon')).toHaveLength(0);
  });

  test('a single board touch pops the moving balloon outside its original native bounds', () => {
    mount();
    const original = buttons('Pop A balloon')[0];
    ReactTestRenderer.act(() => jest.advanceTimersByTime(2400));
    const surface = screen.root.findByProps({ testID: 'balloon-touch-surface' });
    ReactTestRenderer.act(() => {
      surface.props.onTouchStart({
        nativeEvent: { locationX: 153, locationY: 101 },
      });
      original.props.onPress();
      surface.props.onTouchStart({
        nativeEvent: { locationX: 153, locationY: 101 },
      });
    });
    expect(hasLabel('Score 1 of 10')).toBe(true);
  });

  test('supports two fingers without awarding points twice for a repeated touch', () => {
    mount();
    ReactTestRenderer.act(() => jest.advanceTimersByTime(SPAWN_INTERVAL));
    const surface = screen.root.findByProps({ testID: 'balloon-touch-surface' });
    ReactTestRenderer.act(() => {
      surface.props.onTouchStart({
        nativeEvent: {
          changedTouches: [
            { locationX: 90, locationY: 182 },
            { locationX: 270, locationY: 212 },
            { locationX: 270, locationY: 212 },
          ],
        },
      });
    });
    expect(hasLabel('Score 2 of 10')).toBe(true);
  });

  test.each(['A', 'Z'])('mixes only two extra letters with target %s and keeps the target common', target => {
    mount({ params: { Letter: target } });
    ReactTestRenderer.act(() => jest.advanceTimersByTime(SPAWN_INTERVAL * 7));
    const extras = getDistractorLetters(target);
    expect(buttons(`Pop ${target} balloon`)).toHaveLength(6);
    for (const extra of extras) {
      expect(buttons(`Pop ${extra} balloon`)).toHaveLength(1);
    }
    ReactTestRenderer.act(() => buttons(`Pop ${target} balloon`)[0].props.onPressIn());
    ReactTestRenderer.act(() => buttons(`Pop ${extras[0]} balloon`)[0].props.onPressIn());
    expect(hasLabel('Score 1 of 10')).toBe(true);
    expect(
      screen.root.findAll(node => node.props.children === `Find ${target}!`).length,
    ).toBeGreaterThan(0);
  });

  test('enlarges moving letter targets without enlarging bombs or crowding adjacent lanes', () => {
    Math.random.mockReturnValue(0);
    mount();
    ReactTestRenderer.act(() => jest.advanceTimersByTime(SPAWN_INTERVAL));
    function movingFrame(button) {
      let node = button.parent;
      while (node && !StyleSheet.flatten(node.props.style)?.transform) {
        node = node.parent;
      }
      return StyleSheet.flatten(node.props.style);
    }
    const letter = movingFrame(buttons('Pop A balloon')[0]);
    const bomb = movingFrame(buttons('Avoid bomb')[0]);
    expect(letter.width).toBe(bomb.width + BALLOON_TOUCH_PADDING * 2);
    expect(letter.height).toBe(bomb.height + BALLOON_TOUCH_PADDING * 2);
    expect(letter.left + letter.width).toBeLessThan(bomb.left);
    ReactTestRenderer.act(() => buttons('Pop A balloon')[0].props.onPressIn());
    const bombButton = buttons('Avoid bomb')[0];
    ReactTestRenderer.act(() => {
      bombButton.props.onPressIn();
      bombButton.props.onPress();
    });
    expect(hasLabel('Score 0 of 10')).toBe(true);
  });

  test('starts with a safe letter and limits runs of bombs to two', () => {
    Math.random.mockReturnValue(0);
    mount();
    expect(buttons('Avoid bomb')).toHaveLength(0);
    expect(buttons('Pop A balloon')).toHaveLength(1);
    ReactTestRenderer.act(() => jest.advanceTimersByTime(SPAWN_INTERVAL * 5));
    expect(buttons('Avoid bomb')).toHaveLength(4);
    expect(buttons('Pop A balloon')).toHaveLength(2);
  });

  test('puts the result outside the clipped board and keeps replay outside its scroll body', () => {
    mount();
    ReactTestRenderer.act(() => jest.advanceTimersByTime(ROUND_SECONDS * 1000));
    const board = screen.root.findByProps({ testID: 'balloon-play-area' });
    expect(
      board.findAllByProps({ testID: 'balloon-result-overlay' }),
    ).toHaveLength(0);
    const overlay = screen.root.findByProps({
      testID: 'balloon-result-overlay',
    });
    expect(StyleSheet.flatten(overlay.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
    });
    expect(overlay.findAllByType(ScrollView)).toHaveLength(1);
    expect(
      overlay
        .findByType(ScrollView)
        .findAllByProps({ accessibilityLabel: 'Play again' }),
    ).toHaveLength(0);
    expect(buttons('Play again').length).toBeGreaterThan(0);
  });

  test('pauses the clock in the background and resumes with the remaining time', () => {
    mount();
    ReactTestRenderer.act(() => jest.advanceTimersByTime(2500));
    const onAppState = stateListener.mock.calls.at(-1)[1];
    ReactTestRenderer.act(() => onAppState('background'));
    ReactTestRenderer.act(() => jest.advanceTimersByTime(60000));
    expect(hasLabel('18 seconds left')).toBe(true);
    ReactTestRenderer.act(() => onAppState('active'));
    ReactTestRenderer.act(() => jest.advanceTimersByTime(17499));
    expect(buttons('Play again')).toHaveLength(0);
    ReactTestRenderer.act(() => jest.advanceTimersByTime(1));
    expect(buttons('Play again').length).toBeGreaterThan(0);
  });

  test('resizing the play area preserves score and remaining round time', () => {
    mount();
    ReactTestRenderer.act(() => buttons('Pop A balloon')[0].props.onPressIn());
    ReactTestRenderer.act(() => jest.advanceTimersByTime(3000));
    expect(hasLabel('Score 1 of 10')).toBe(true);
    expect(hasLabel('17 seconds left')).toBe(true);
    ReactTestRenderer.act(() => {
      screen.root.findByProps({ testID: 'balloon-play-area' }).props.onLayout({
        nativeEvent: { layout: { width: 260, height: 600 } },
      });
    });
    expect(hasLabel('Score 1 of 10')).toBe(true);
    expect(hasLabel('17 seconds left')).toBe(true);
    ReactTestRenderer.act(() => jest.advanceTimersByTime(17000));
    expect(buttons('Play again').length).toBeGreaterThan(0);
  });

  test('limits the result card to a short landscape window with large text', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 640,
      height: 240,
      scale: 1,
      fontScale: 2,
    });
    mount();
    ReactTestRenderer.act(() => jest.advanceTimersByTime(ROUND_SECONDS * 1000));
    const overlay = screen.root.findByProps({
      testID: 'balloon-result-overlay',
    });
    const boundedCard = overlay.findAll(
      node => StyleSheet.flatten(node.props.style)?.maxHeight === 216,
    );
    expect(boundedCard.length).toBeGreaterThan(0);
    expect(overlay.findAllByType(ScrollView)).toHaveLength(1);
    expect(buttons('Play again').length).toBeGreaterThan(0);
  });

  test('pauses when another screen is focused and clears timers on unmount', () => {
    mount();
    useIsFocused.mockReturnValue(false);
    ReactTestRenderer.act(() => screen.update(tree()));
    ReactTestRenderer.act(() => jest.advanceTimersByTime(0));
    expect(jest.getTimerCount()).toBe(0);
    ReactTestRenderer.act(() => jest.advanceTimersByTime(30000));
    expect(hasLabel('20 seconds left')).toBe(true);
    ReactTestRenderer.act(() => screen.unmount());
    screen = undefined;
    ReactTestRenderer.act(() => jest.advanceTimersByTime(0));
    expect(jest.getTimerCount()).toBe(0);
  });
});
