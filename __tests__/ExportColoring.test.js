import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import {
  CANVAS_EXPORT_SIZE,
  exportColoring,
} from '../src/games/exportColoring';

const originalOS = Object.getOwnPropertyDescriptor(Platform, 'OS');
const originalVersion = Object.getOwnPropertyDescriptor(Platform, 'Version');
const originalGallery = NativeModules.DrawingGallery;

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  Object.defineProperty(Platform, 'Version', { configurable: true, value: 36 });
  NativeModules.DrawingGallery = {
    savePng: jest.fn().mockResolvedValue('content://media/image/123'),
  };
  jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', originalOS);
  if (originalVersion)
    Object.defineProperty(Platform, 'Version', originalVersion);
  else delete Platform.Version;
  NativeModules.DrawingGallery = originalGallery;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('exports only the supplied SVG at 1200px and saves it without photo-library access on modern Android', async () => {
  const svg = { toDataURL: jest.fn(callback => callback('canvas-png-data')) };
  await expect(exportColoring(svg, 'cat')).resolves.toBe(
    'content://media/image/123',
  );
  expect(svg.toDataURL).toHaveBeenCalledWith(expect.any(Function), {
    width: CANVAS_EXPORT_SIZE,
    height: CANVAS_EXPORT_SIZE,
  });
  expect(NativeModules.DrawingGallery.savePng).toHaveBeenCalledWith(
    'canvas-png-data',
    'cat',
  );
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('requests write permission only on Android 9 and older; denial does not create an image', async () => {
  Object.defineProperty(Platform, 'Version', { configurable: true, value: 28 });
  PermissionsAndroid.request.mockResolvedValue(
    PermissionsAndroid.RESULTS.DENIED,
  );
  const svg = { toDataURL: jest.fn() };
  await expect(exportColoring(svg, 'fish')).rejects.toMatchObject({
    code: 'E_PERMISSION',
  });
  expect(PermissionsAndroid.request).toHaveBeenCalledWith(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  );
  expect(svg.toDataURL).not.toHaveBeenCalled();
  expect(NativeModules.DrawingGallery.savePng).not.toHaveBeenCalled();
});

test('legacy Android can export after write permission is granted', async () => {
  Object.defineProperty(Platform, 'Version', { configurable: true, value: 28 });
  await exportColoring({ toDataURL: callback => callback('canvas') }, 'ball');
  expect(NativeModules.DrawingGallery.savePng).toHaveBeenCalledWith(
    'canvas',
    'ball',
  );
});

test('empty SVG output or a native gallery failure never reports success', async () => {
  await expect(
    exportColoring({ toDataURL: callback => callback('') }, 'fish'),
  ).rejects.toThrow('could not be created');
  expect(NativeModules.DrawingGallery.savePng).not.toHaveBeenCalled();
  NativeModules.DrawingGallery.savePng.mockRejectedValueOnce(
    new Error('disk full'),
  );
  await expect(
    exportColoring({ toDataURL: callback => callback('canvas') }, 'fish'),
  ).rejects.toThrow('disk full');
});

test('a stalled renderer times out without writing any picture', async () => {
  const result = exportColoring({ toDataURL: () => {} }, 'fish');
  const error = result.catch(failure => failure);
  jest.advanceTimersByTime(10000);
  await expect(error).resolves.toMatchObject({
    message: 'Picture export timed out.',
  });
  expect(NativeModules.DrawingGallery.savePng).not.toHaveBeenCalled();
});

test('a missing SVG or native gallery module produces a recoverable error', async () => {
  await expect(exportColoring(null, 'fish')).rejects.toThrow('not ready');
  NativeModules.DrawingGallery = undefined;
  await expect(exportColoring({}, 'fish')).rejects.toThrow('unavailable');
});
