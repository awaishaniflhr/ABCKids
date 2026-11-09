import { Platform } from 'react-native';
import Sound from 'react-native-sound';
import { createTracingAudio, TRACING_IDLE_MS } from '../src/games/tracingAudio';

jest.mock('react-native-sound', () => {
  const MockSound = jest.fn(function (filename, base, onLoad) {
    this.finishLoading = onLoad;
    this.play = jest.fn();
    this.pause = jest.fn();
    this.stop = jest.fn();
    this.release = jest.fn();
    this.setNumberOfLoops = jest.fn();
    this.setVolume = jest.fn();
  });
  MockSound.MAIN_BUNDLE = '/bundle path';
  return { __esModule: true, default: MockSound };
});

let audio;
beforeEach(() => {
  jest.useFakeTimers();
  Sound.mockClear();
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  audio?.release();
  audio = undefined;
  jest.useRealTimers();
  jest.restoreAllMocks();
});
function prepare() {
  audio = createTracingAudio();
  for (const sound of Sound.mock.instances) sound.finishLoading(null);
  return Sound.mock.instances;
}

test('preloads one quiet loop and one success chime without playing on finger-down', () => {
  const [loop, success] = prepare();
  expect(Sound).toHaveBeenCalledTimes(2);
  expect(Sound.mock.calls[0][0]).toBe('tracing_loop.wav');
  expect(loop.setNumberOfLoops).toHaveBeenCalledWith(-1);
  expect(success.setNumberOfLoops).toHaveBeenCalledWith(0);
  expect(loop.play).not.toHaveBeenCalled();
});

test('movement resumes the cached sound once, and a stationary finger becomes silent', () => {
  const [loop] = prepare();
  audio.move();
  audio.move();
  audio.move();
  expect(loop.play).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(TRACING_IDLE_MS - 1);
  expect(loop.pause).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(loop.pause).toHaveBeenCalledTimes(1);
  audio.move();
  expect(loop.play).toHaveBeenCalledTimes(2);
  expect(Sound).toHaveBeenCalledTimes(2);
});

test('lifting or moving off-path stops the loop immediately and clears its idle timer', () => {
  const [loop] = prepare();
  audio.move();
  audio.stop();
  expect(loop.pause).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(TRACING_IDLE_MS * 2);
  expect(loop.pause).toHaveBeenCalledTimes(1);
});

test('late loading never starts a sound after finger movement has stopped', () => {
  audio = createTracingAudio();
  audio.move();
  jest.advanceTimersByTime(TRACING_IDLE_MS);
  const [loop] = Sound.mock.instances;
  loop.finishLoading(null);
  expect(loop.play).not.toHaveBeenCalled();
});

test('a sound that finishes preloading during a valid movement can start immediately', () => {
  audio = createTracingAudio();
  audio.move();
  const [loop] = Sound.mock.instances;
  loop.finishLoading(null);
  expect(loop.play).toHaveBeenCalledTimes(1);
});

test('success stops tracing audio, plays one chime, and reset stops that chime', () => {
  const [loop, success] = prepare();
  audio.move();
  audio.celebrate();
  audio.celebrate();
  expect(loop.pause).toHaveBeenCalledTimes(1);
  expect(success.play).toHaveBeenCalledTimes(1);
  audio.reset();
  expect(success.stop).toHaveBeenCalledTimes(1);
});

test('leaving releases all loaded players and ignores future callbacks or motion', () => {
  const [loop, success] = prepare();
  audio.move();
  audio.release();
  audio.release();
  audio.move();
  audio.celebrate();
  expect(loop.release).toHaveBeenCalledTimes(1);
  expect(success.release).toHaveBeenCalledTimes(1);
  expect(loop.play).toHaveBeenCalledTimes(1);
  expect(success.play).not.toHaveBeenCalled();
});

test('leaving before preload finishes releases the late player without starting audio', () => {
  audio = createTracingAudio();
  audio.move();
  audio.release();
  const [loop] = Sound.mock.instances;
  loop.finishLoading(null);
  expect(loop.release).toHaveBeenCalledTimes(1);
  expect(loop.play).not.toHaveBeenCalled();
});

test('iOS uses its bundled local file URL, including escaped spaces', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  prepare();
  expect(Sound.mock.calls[0][0]).toBe('file:///bundle%20path/tracing_loop.wav');
});

test('audio load errors leave the game usable and silent', () => {
  audio = createTracingAudio();
  for (const sound of Sound.mock.instances)
    sound.finishLoading(new Error('unavailable'));
  expect(() => {
    audio.move();
    audio.celebrate();
    audio.release();
  }).not.toThrow();
  expect(Sound.mock.instances[0].play).not.toHaveBeenCalled();
});
