import React from 'react';
import { Text, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Coloring from '../src/screens/Coloring';
import ColorsTemplate from '../src/screens/ColorsTemplate';
import { SKETCH_OUTLINE } from '../src/components/ColoringSketch';
import { SAVED_NOTICE_MS } from '../src/components/SavedDrawingNotice';
import { exportColoring } from '../src/games/exportColoring';
import {
  COLORING_PALETTE,
  COLORING_TEMPLATES,
  getColoringTemplate,
} from '../src/games/coloringTemplates';
import {
  coloringReducer,
  createColoring,
  drawingStorageKey,
  parseDrawing,
  serializeDrawing,
} from '../src/games/coloring';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../src/games/exportColoring', () => ({ exportColoring: jest.fn() }));
jest.mock('react-native-orientation-locker', () => ({
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

const red = COLORING_PALETTE[0].value;
const blue = COLORING_PALETTE[5].value;

test('fills and recolours one region without changing its neighbours; erase, undo, redo and reset restore exactly', () => {
  let state = createColoring();
  state = coloringReducer(state, { type: 'fill', id: 'head', color: red });
  state = coloringReducer(state, { type: 'fill', id: 'body', color: blue });
  const painted = state;
  expect(
    coloringReducer(state, { type: 'fill', id: 'body', color: blue }),
  ).toBe(state);
  state = coloringReducer(state, { type: 'fill', id: 'head', color: blue });
  expect(state.fills).toEqual({ head: blue, body: blue });
  state = coloringReducer(state, {
    type: 'fill',
    id: 'head',
    color: undefined,
  });
  expect(state.fills).toEqual({ body: blue });
  state = coloringReducer(state, { type: 'undo' });
  state = coloringReducer(state, { type: 'undo' });
  expect(state.fills).toEqual(painted.fills);
  state = coloringReducer(state, { type: 'redo' });
  expect(state.fills.head).toBe(blue);
  state = coloringReducer(state, { type: 'clear' });
  expect(state.fills).toEqual({});
  state = coloringReducer(state, { type: 'undo' });
  expect(state.fills).toEqual({ head: blue, body: blue });
  state = coloringReducer(state, { type: 'fill', id: 'head', color: red });
  expect(state.future).toEqual([]);
});

test('limits undo memory during a long coloring session', () => {
  let state = createColoring();
  for (let index = 0; index < 150; index++) {
    state = coloringReducer(state, {
      type: 'fill',
      id: 'body',
      color: index % 2 ? red : blue,
    });
  }
  expect(state.past).toHaveLength(60);
});

test.each(COLORING_TEMPLATES)(
  '$name has unique, closed fill regions and its own validated save',
  template => {
    expect(new Set(template.regions.map(region => region.id)).size).toBe(
      template.regions.length,
    );
    for (const region of template.regions) {
      if (region.type === 'path') expect(region.props.d).toMatch(/Z$/);
      else expect(region.props.r || region.props.rx).toBeGreaterThan(0);
    }
    const fills = { [template.regions[0].id]: red };
    expect(parseDrawing(serializeDrawing(template, fills), template)).toEqual(
      fills,
    );
    expect(drawingStorageKey(template)).toContain(template.id);
  },
);

test('ignores invalid saved region colors and rejects corrupt or incompatible drawings', () => {
  const fish = getColoringTemplate('Fish');
  expect(getColoringTemplate('ButterFly').id).toBe('butterfly');
  expect(
    parseDrawing(
      serializeDrawing(fish, { body: blue, head: 'invalid', invented: red }),
      fish,
    ),
  ).toEqual({ body: blue });
  expect(() => parseDrawing('bad json', fish)).toThrow();
  expect(() =>
    parseDrawing(serializeDrawing(getColoringTemplate('cat'), {}), fish),
  ).toThrow();
  expect(parseDrawing(null, fish)).toEqual({});
});

describe('colouring screen', () => {
  let screen;
  beforeEach(() => {
    AsyncStorage.getItem.mockReset().mockResolvedValue(null);
    AsyncStorage.setItem.mockReset().mockResolvedValue(undefined);
    exportColoring
      .mockReset()
      .mockResolvedValue('content://media/external/images/media/123');
  });
  afterEach(() => {
    if (screen) ReactTestRenderer.act(() => screen.unmount());
    screen = undefined;
    jest.useRealTimers();
  });

  async function mount(id = 'fish') {
    await ReactTestRenderer.act(async () => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <Coloring
            route={{ params: { templateId: id } }}
            navigation={{ goBack: jest.fn() }}
          />
        </SafeAreaProvider>,
      );
    });
  }
  function region(id) {
    return screen.root.findAll(
      node =>
        node.props.testID === `region-${id}` && node.props.fill !== undefined,
    )[0];
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
  async function paint(id) {
    await ReactTestRenderer.act(async () => region(id).props.onPress());
  }

  test('colors only the tapped geometry, preserves outlines, and leaves the background inert', async () => {
    await mount();
    await press('Choose blue');
    await paint('tail');
    expect(region('tail').props.fill).toBe(blue);
    expect(region('body').props.fill).toBe('#FFFFFF');
    expect(region('head').props.fill).toBe('#FFFFFF');
    expect(region('rear-body').props.fill).toBe('#FFFFFF');
    expect(region('tail').props.stroke).toBe(SKETCH_OUTLINE);
    const canvas = screen.root.findByProps({ testID: 'colouring-canvas' });
    expect(canvas.props.onPress).toBeUndefined();
    expect(canvas.findAllByType(Text)).toHaveLength(0);
    expect(
      canvas.findByProps({ testID: 'sketch-fish' }).props.onPress,
    ).toBeUndefined();
    await press('Choose red');
    await paint('tail');
    expect(region('tail').props.fill).toBe(red);
    await press('Undo');
    expect(region('tail').props.fill).toBe(blue);
    await press('Redo');
    expect(region('tail').props.fill).toBe(red);
    await press('Erase one part');
    await paint('tail');
    expect(region('tail').props.fill).toBe('#FFFFFF');
    await press('Undo');
    expect(region('tail').props.fill).toBe(red);
  });

  test.each(['fish', 'cat', 'car', 'butterfly', 'dog', 'ball'])(
    'opens %s and saves independently',
    async id => {
      await mount(id);
      const template = getColoringTemplate(id);
      await paint(template.regions[0].id);
      expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
        drawingStorageKey(template),
        serializeDrawing(template, { [template.regions[0].id]: red }),
      );
    },
  );

  test('restores saved regions and reset can be undone', async () => {
    const template = getColoringTemplate('fish');
    AsyncStorage.getItem.mockResolvedValue(
      serializeDrawing(template, { head: blue, tail: red }),
    );
    await mount();
    expect(region('head').props.fill).toBe(blue);
    expect(region('tail').props.fill).toBe(red);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    await press('Reset');
    expect(region('head').props.fill).toBe('#FFFFFF');
    await press('Undo');
    expect(region('head').props.fill).toBe(blue);
    expect(region('tail').props.fill).toBe(red);
  });

  test('a quick colour selection and tap use the new colour before the next render', async () => {
    await mount();
    await ReactTestRenderer.act(async () => {
      button('Choose blue').props.onPress();
      region('body').props.onPress();
    });
    expect(region('body').props.fill).toBe(blue);
    expect(region('rear-body').props.fill).toBe('#FFFFFF');
    await ReactTestRenderer.act(async () => {
      button('Erase one part').props.onPress();
      region('body').props.onPress();
    });
    expect(region('body').props.fill).toBe('#FFFFFF');
  });

  test('reopening a picture waits for its pending save before restoring colours', async () => {
    let finishSave;
    let stored = null;
    AsyncStorage.getItem.mockImplementation(async () => stored);
    AsyncStorage.setItem.mockImplementationOnce(
      (_key, value) =>
        new Promise(resolve => {
          finishSave = () => {
            stored = value;
            resolve();
          };
        }),
    );
    await mount();
    await paint('head');
    ReactTestRenderer.act(() => screen.unmount());
    screen = undefined;
    await mount();
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => finishSave());
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
    expect(region('head').props.fill).toBe(red);
  });

  test('orders rapid saves and finishes saving after leaving the screen', async () => {
    let finishFirstSave;
    AsyncStorage.setItem.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishFirstSave = resolve;
        }),
    );
    await mount();
    await paint('head');
    await paint('tail');
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => screen.unmount());
    screen = undefined;
    await ReactTestRenderer.act(async () => finishFirstSave());
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    expect(JSON.parse(AsyncStorage.setItem.mock.calls[1][1]).fills).toEqual({
      head: red,
      tail: red,
    });
  });

  test('handles a failed save and lets Save retry it', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('storage full'));
    await mount();
    await paint('head');
    expect(JSON.stringify(screen.toJSON())).toContain('Tap Save to try again');
    await press('Save');
    expect(JSON.stringify(screen.toJSON())).toContain('Saved on this device');
  });

  test('manual Save shows confirmation only after success and closes automatically after three seconds', async () => {
    jest.useFakeTimers();
    await mount();
    await paint('head');
    const notices = () =>
      screen.root.findAllByProps({ testID: 'drawing-saved-notice' });
    // Automatic saving must not interrupt coloring.
    expect(notices()).toHaveLength(0);
    let finishSave;
    AsyncStorage.setItem.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishSave = resolve;
        }),
    );
    await ReactTestRenderer.act(async () => {
      button('Save').props.onPress();
    });
    expect(button('Save').props.disabled).toBe(true);
    expect(notices()).toHaveLength(0);
    await ReactTestRenderer.act(async () => finishSave());
    expect(notices().length).toBeGreaterThan(0);
    expect(JSON.stringify(screen.toJSON())).toContain(
      "Your picture is saved in your phone's gallery.",
    );
    ReactTestRenderer.act(() => jest.advanceTimersByTime(SAVED_NOTICE_MS - 1));
    expect(notices().length).toBeGreaterThan(0);
    ReactTestRenderer.act(() => jest.advanceTimersByTime(1));
    expect(notices()).toHaveLength(0);
  });

  test('a failed manual save never shows success; retry does and its timer is cleared on exit', async () => {
    jest.useFakeTimers();
    await mount();
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('storage full'));
    await press('Save');
    expect(
      screen.root.findAllByProps({ testID: 'drawing-saved-notice' }),
    ).toHaveLength(0);
    expect(JSON.stringify(screen.toJSON())).toContain(
      'Could not save the picture. Please try again.',
    );
    await press('Save');
    expect(
      screen.root.findAllByProps({ testID: 'drawing-saved-notice' }).length,
    ).toBeGreaterThan(0);
    ReactTestRenderer.act(() => screen.unmount());
    screen = undefined;
    ReactTestRenderer.act(() => jest.advanceTimersByTime(0));
    expect(jest.getTimerCount()).toBe(0);
  });

  test('a corrupt save does not crash the editor', async () => {
    AsyncStorage.getItem.mockResolvedValue('bad json');
    await mount();
    expect(JSON.stringify(screen.toJSON())).toContain(
      'Could not open saved colours',
    );
    await paint('head');
    expect(region('head').props.fill).toBe(red);
  });

  test('Save exports only the sketch SVG and reports a failed gallery export without losing colours', async () => {
    await mount();
    await paint('head');
    exportColoring.mockRejectedValueOnce(new Error('gallery write failed'));
    await press('Save');
    expect(exportColoring).toHaveBeenCalledWith(
      expect.objectContaining({ toDataURL: expect.any(Function) }),
      'fish',
    );
    expect(
      screen.root.findAllByProps({ testID: 'drawing-saved-notice' }),
    ).toHaveLength(0);
    expect(JSON.stringify(screen.toJSON())).toContain(
      'Could not save the picture. Please try again.',
    );
    expect(region('head').props.fill).toBe(red);
    await press('Save');
    expect(
      screen.root.findAllByProps({ testID: 'drawing-saved-notice' }).length,
    ).toBeGreaterThan(0);
  });

  test('the redesigned gallery opens each corresponding sketch', async () => {
    const navigate = jest.fn();
    await ReactTestRenderer.act(async () => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <ColorsTemplate navigation={{ navigate, goBack: jest.fn() }} />
        </SafeAreaProvider>,
      );
    });
    for (const template of COLORING_TEMPLATES) {
      await press(`Colour ${template.name.toLowerCase()}`);
      expect(navigate).toHaveBeenLastCalledWith('Coloring', {
        templateId: template.id,
      });
    }
    expect(screen.root.findAllByType(View).length).toBeGreaterThan(0);
  });
});
