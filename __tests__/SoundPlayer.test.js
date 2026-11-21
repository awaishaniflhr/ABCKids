// A fake react-native-sound: loads on the next timer tick (like the real,
// asynchronous one); each play() "finishes" when the test calls finish().
const sounds = [];
jest.mock('react-native-sound', () => {
  function FakeSound(file, _bundle, onLoad) {
    this.file = file;
    this.plays = 0;
    this.released = false;
    this.play = done => {
      this.plays += 1;
      this.finish = () => done(true);
    };
    this.stop = jest.fn();
    this.release = () => {
      this.released = true;
    };
    sounds.push(this);
    setTimeout(() => onLoad(null), 0);
  }
  FakeSound.MAIN_BUNDLE = 'bundle';
  return FakeSound;
});

const SoundPlayer = require('../src/utills/SoundPlayer').default;

beforeEach(() => {
  jest.useFakeTimers();
  sounds.length = 0;
});
afterEach(() => {
  SoundPlayer.stop();
  jest.useRealTimers();
});

test('plays once by default', () => {
  SoundPlayer.playSoundFile('cowsound');
  jest.advanceTimersByTime(0);
  const [cow] = sounds;
  cow.finish();
  jest.advanceTimersByTime(10000);
  expect(cow.plays).toBe(1);
  expect(cow.released).toBe(true);
});

test('repeats after a pause until another sound is chosen', () => {
  const onRepeat = jest.fn();
  SoundPlayer.playSoundFile('cowsound', 'mp3', {
    repeat: true,
    gap: 1000,
    onRepeat,
  });
  jest.advanceTimersByTime(0);
  const [cow] = sounds;
  for (let round = 1; round <= 3; round++) {
    expect(cow.plays).toBe(round);
    cow.finish();
    jest.advanceTimersByTime(999);
    expect(cow.plays).toBe(round); // still pausing
    jest.advanceTimersByTime(1);
  }
  expect(onRepeat).toHaveBeenCalledTimes(3);

  SoundPlayer.playSoundFile('dogsound', 'mp3', { repeat: true, gap: 1000 });
  jest.advanceTimersByTime(0);
  expect(cow.released).toBe(true);
  cow.finish(); // a late callback from the old sound changes nothing
  jest.advanceTimersByTime(5000);
  expect(cow.plays).toBe(4);
  expect(sounds[1].file).toBe('dogsound.mp3');
});

test('stop() ends the repeat, even during the pause', () => {
  const onRepeat = jest.fn();
  SoundPlayer.playSoundFile('lionsound', 'mp3', {
    repeat: true,
    gap: 1000,
    onRepeat,
  });
  jest.advanceTimersByTime(0);
  const [lion] = sounds;
  lion.finish();
  SoundPlayer.stop();
  jest.advanceTimersByTime(5000);
  expect(lion.plays).toBe(1);
  expect(onRepeat).not.toHaveBeenCalled();
  expect(lion.released).toBe(true);
});
