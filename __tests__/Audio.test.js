// A fake react-native-sound that records each track and "loads" instantly.
const created = [];
jest.mock('react-native-sound', () => {
  function FakeSound(source, base, onLoad) {
    this.source = source;
    this.play = jest.fn();
    this.pause = jest.fn();
    this.stop = jest.fn();
    this.release = jest.fn();
    this.setNumberOfLoops = jest.fn();
    this.setVolume = jest.fn();
    created.push(this);
    setTimeout(() => onLoad(null), 0);
  }
  FakeSound.MAIN_BUNDLE = '';
  return FakeSound;
});
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));

let audio;
let tracing;
let AsyncStorage;
beforeEach(() => {
  jest.useFakeTimers();
  created.length = 0;
  // A fresh copy of the audio code (and the storage it uses) for each test.
  jest.isolateModules(() => {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
    audio = require('../src/services/audio');
    tracing = require('../src/games/tracingAudio');
  });
  AsyncStorage.__reset();
});
afterEach(() => jest.useRealTimers());

const tick = () => jest.advanceTimersByTime(10);

describe('music', () => {
  it('loops the Home tune quietly and switches to the tracing music', () => {
    audio.playMusic('home');
    tick();
    const home = created.find(sound => /music_home/.test(sound.source));
    expect(home.setNumberOfLoops).toHaveBeenCalledWith(-1);
    expect(home.play).toHaveBeenCalled();

    // Opening a tracing game: Home's tune stops, the calm music starts.
    audio.releaseMusic('home');
    audio.playMusic('tracing');
    tick();
    expect(home.release).toHaveBeenCalled();
    const calm = created.find(sound => /music_tracing/.test(sound.source));
    expect(calm.play).toHaveBeenCalled();
    expect(calm.setVolume.mock.calls[0][0]).toBeLessThan(
      home.setVolume.mock.calls[0][0],
    );
  });

  it('keeps the same track playing between screens that share it', () => {
    audio.playMusic('tracing');
    tick();
    audio.releaseMusic('tracing');
    audio.playMusic('tracing');
    jest.advanceTimersByTime(1000);
    expect(created).toHaveLength(1);
    expect(created[0].release).not.toHaveBeenCalled();
  });

  it('stops after a music screen closes and nothing else asks for it', () => {
    audio.playMusic('home');
    tick();
    audio.releaseMusic('home');
    jest.advanceTimersByTime(1000);
    expect(created[0].release).toHaveBeenCalled();
  });

  it('turning music off pauses it, and the choice is remembered', async () => {
    audio.playMusic('home');
    tick();
    audio.setMusicOn(false);
    expect(created[0].pause).toHaveBeenCalled();
    expect(audio.isMusicOn()).toBe(false);
    await Promise.resolve();
    expect(JSON.parse(await AsyncStorage.getItem('@abckids/audio/v1/settings')))
      .toEqual({ music: false, tracingSounds: true });
  });

  it('loads saved choices when the app starts', async () => {
    await AsyncStorage.setItem(
      '@abckids/audio/v1/settings',
      JSON.stringify({ music: true, tracingSounds: false }),
    );
    audio.initAudio();
    await Promise.resolve();
    await Promise.resolve();
    expect(audio.areTracingSoundsOn()).toBe(false);
    expect(audio.isMusicOn()).toBe(true);
  });
});

describe('tracing sounds setting', () => {
  it('plays the tracing sound and chime when on, and nothing when off', () => {
    const sounds = tracing.createTracingAudio();
    tick();
    const [loop, chime] = created;
    sounds.move();
    expect(loop.play).toHaveBeenCalledTimes(1);
    sounds.celebrate();
    expect(chime.play).toHaveBeenCalledTimes(1);

    audio.setTracingSoundsOn(false);
    sounds.reset();
    sounds.move();
    sounds.celebrate();
    expect(loop.play).toHaveBeenCalledTimes(1);
    expect(chime.play).toHaveBeenCalledTimes(1);
  });
});
