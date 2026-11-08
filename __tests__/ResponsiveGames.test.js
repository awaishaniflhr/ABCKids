import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Home from '../src/screens/Home';
import Letters from '../src/screens/Letters';
import Numbers from '../src/screens/Numbers';
import PoppBalloonsTemplate from '../src/screens/PoppBalloonsTemplate';
import Sounds from '../src/screens/Sounds';
import SoundScreen from '../src/screens/SoundScreen';
import BirdSound from '../src/screens/BirdSound';
import LetterSound from '../src/screens/LetterSound';
import NumberKeyboard from '../src/screens/NumberKeyboard';
import Phone from '../src/screens/Phone';
import Numeric from '../src/screens/Numeric';
import MemoryFlipGame from '../src/screens/MemoryFlipGame';
import AlphabetsShapes from '../src/screens/AlphabetsShapes';
import DragLetters from '../src/screens/DragLetters';
import ColorsTemplate from '../src/screens/ColorsTemplate';
import Coloring from '../src/screens/Coloring';
import Poems from '../src/screens/Poems';
import DragTile from '../src/components/DragTile';
import { gridLayout, containsPoint } from '../src/games/responsiveLayout';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-tts', () => ({
  getInitStatus: jest.fn(() => Promise.resolve()),
  setDefaultLanguage: jest.fn(() => Promise.resolve()),
  setDefaultRate: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  speak: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-sound', () => jest.fn());
jest.mock('../src/utills/SoundPlayer', () => ({
  stop: jest.fn(),
  playSoundFile: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

const original = Dimensions.get('window');
const metrics = (width, height) => ({ width, height, scale: 1, fontScale: 1 });
const viewport = (width, height) =>
  Dimensions.set({
    window: metrics(width, height),
    screen: metrics(width, height),
  });
let screen;
let targetBounds;
let measure;
beforeEach(() => {
  jest.useFakeTimers();
  viewport(393, 873);
  targetBounds = {};
  measure = jest
    .spyOn(View.prototype, 'measureInWindow')
    .mockImplementation(function (callback) {
      const bounds = targetBounds[this.props.accessibilityLabel] || {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      callback(bounds.x, bounds.y, bounds.width, bounds.height);
    });
});
afterEach(() => {
  if (screen) ReactTestRenderer.act(() => screen.unmount());
  screen = undefined;
  measure.mockRestore();
  Dimensions.set({ window: original, screen: original });
  jest.useRealTimers();
});
async function mount(Screen) {
  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(
      <SafeAreaProvider>
        <Screen navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />
      </SafeAreaProvider>,
      {
        createNodeMock: element => {
          const label = element.props.accessibilityLabel;
          if (label?.startsWith('Match '))
            return {
              measureInWindow: callback => {
                const bounds = targetBounds[label] || {
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                };
                callback(bounds.x, bounds.y, bounds.width, bounds.height);
              },
            };
          return null;
        },
      },
    );
  });
}
function button(label) {
  return screen.root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
}
async function press(label) {
  await ReactTestRenderer.act(async () => button(label).props.onPress());
}
async function rotate(width = 873, height = 393) {
  await ReactTestRenderer.act(async () => viewport(width, height));
}
function text() {
  return screen.root
    .findAllByType(Text)
    .map(node => [].concat(node.props.children).join(''))
    .join(' ');
}

test.each([320, 393, 568, 873, 1280])(
  'grid cells fit a %s dp window without shrinking the touch targets',
  width => {
    const available = width - 24;
    const grid = gridLayout(available, 70, 8);
    expect(grid.cellWidth).toBeGreaterThanOrEqual(44);
    expect(
      grid.columns * grid.cellWidth + (grid.columns - 1) * grid.gap,
    ).toBeLessThanOrEqual(available + 0.01);
  },
);

test('drop hit testing follows measured target bounds after rotation', () => {
  expect(
    containsPoint({ x: 20, y: 200, width: 80, height: 80 }, { x: 50, y: 230 }),
  ).toBe(true);
  expect(
    containsPoint({ x: 200, y: 20, width: 80, height: 80 }, { x: 50, y: 230 }),
  ).toBe(false);
  expect(
    containsPoint({ x: 200, y: 20, width: 80, height: 80 }, { x: 230, y: 50 }),
  ).toBe(true);
});

test.each([
  Home,
  Letters,
  Numbers,
  PoppBalloonsTemplate,
  Sounds,
  SoundScreen,
  BirdSound,
  LetterSound,
  NumberKeyboard,
  Phone,
  Numeric,
  MemoryFlipGame,
  AlphabetsShapes,
  DragLetters,
  ColorsTemplate,
  Coloring,
  Poems,
])(
  '%p renders and survives portrait / landscape / tablet resizing',
  async Screen => {
    await mount(Screen);
    await rotate(568, 320);
    await rotate(1280, 800);
    await rotate(320, 568);
    expect(screen.toJSON()).not.toBeNull();
  },
);

test('a flipped memory card survives rotation without reshuffling the game', async () => {
  await mount(MemoryFlipGame);
  await press('Flip card 1');
  const revealed = screen.root.findAll(node =>
    /^Card 1: /.test(node.props.accessibilityLabel || ''),
  )[0].props.accessibilityLabel;
  await rotate();
  expect(
    screen.root.findAllByProps({ accessibilityLabel: revealed }).length,
  ).toBeGreaterThan(0);
});

test('counting keeps the selected number during rotation', async () => {
  await mount(NumberKeyboard);
  await press('Count 7');
  await rotate();
  expect(text()).toContain('Seven');
});

test('addition retains its question and correct answer while rotating', async () => {
  await mount(Numeric);
  const expression = text().match(/(\d+) \+ (\d+) = \?/);
  const sum = Number(expression[1]) + Number(expression[2]);
  await press(String(sum));
  await rotate();
  expect(text()).toContain(`${expression[1]} + ${expression[2]} = ${sum}`);
});

test('animal matching uses the rotated drop target and preserves completed matches', async () => {
  await mount(AlphabetsShapes);
  targetBounds['Match Cat'] = { x: 220, y: 200, width: 90, height: 90 };
  let cat = screen.root
    .findAllByType(DragTile)
    .find(node => node.props.label === 'Drag Cat');
  await ReactTestRenderer.act(async () => cat.props.onDrop({ x: 250, y: 230 }));
  expect(
    screen.root
      .findAllByType(DragTile)
      .some(node => node.props.label === 'Drag Cat'),
  ).toBe(false);
  await rotate();
  targetBounds['Match Tiger'] = { x: 100, y: 220, width: 90, height: 90 };
  const tiger = screen.root
    .findAllByType(DragTile)
    .find(node => node.props.label === 'Drag Tiger');
  await ReactTestRenderer.act(async () =>
    tiger.props.onDrop({ x: 250, y: 130 }),
  );
  expect(
    screen.root
      .findAllByType(DragTile)
      .some(node => node.props.label === 'Drag Tiger'),
  ).toBe(true);
  await ReactTestRenderer.act(async () =>
    tiger.props.onDrop({ x: 130, y: 250 }),
  );
  expect(
    screen.root
      .findAllByType(DragTile)
      .some(node => node.props.label === 'Drag Tiger'),
  ).toBe(false);
  expect(
    screen.root
      .findAllByType(DragTile)
      .some(node => node.props.label === 'Drag Cat'),
  ).toBe(false);
});

test('coloring keeps filled parts when rotating the canvas and palette', async () => {
  await mount(Coloring);
  const head = () =>
    screen.root.findAll(
      node =>
        node.props.testID === 'region-head' && node.props.fill !== undefined,
    )[0];
  await ReactTestRenderer.act(async () => head().props.onPress());
  const color = head().props.fill;
  await rotate();
  expect(head().props.fill).toBe(color);
  expect(color).not.toBe('#FFFFFF');
});

test('a phone call continues through rotation', async () => {
  await mount(Phone);
  await press('Call Cat');
  await press('Start call');
  await rotate();
  expect(text()).toContain('Cat');
  expect(text()).toContain('Calling…');
  ReactTestRenderer.act(() => jest.advanceTimersByTime(3000));
  expect(text()).toContain('00:00');
});
