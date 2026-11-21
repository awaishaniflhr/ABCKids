import Sound from 'react-native-sound';

// Use one audio library for the copied games and bundled songs.
let currentSound;
let repeatTimer;

function stop() {
  clearTimeout(repeatTimer);
  repeatTimer = undefined;
  const sound = currentSound;
  currentSound = undefined;
  if (sound) {
    sound.stop();
    sound.release();
  }
}

// Plays a bundled sound. With `repeat`, the sound plays again after a short
// pause (`gap` ms) until something else is played or stop() is called;
// `onRepeat` runs each time it starts again.
function playSoundFile(name, extension = 'mp3', options = {}) {
  const { repeat = false, gap = 1200, onRepeat } = options;
  stop();
  const sound = new Sound(`${name}.${extension}`, Sound.MAIN_BUNDLE, error => {
    if (currentSound !== sound) {
      sound.release();
      return;
    }
    if (error) {
      console.warn(
        `Unable to load ${name}.${extension}. Check res/raw.`,
        error,
      );
      stop();
      return;
    }
    const play = () =>
      sound.play(() => {
        if (currentSound !== sound) return;
        if (!repeat) {
          stop();
          return;
        }
        repeatTimer = setTimeout(() => {
          if (currentSound !== sound) return;
          onRepeat?.();
          play();
        }, gap);
      });
    play();
  });
  currentSound = sound;
}

export default { playSoundFile, stop };
