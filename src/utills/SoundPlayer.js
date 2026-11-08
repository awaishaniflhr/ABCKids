import Sound from 'react-native-sound';

// Use one audio library for the copied games and bundled songs.
let currentSound;

function stop() {
  const sound = currentSound;
  currentSound = undefined;
  if (sound) {
    sound.stop();
    sound.release();
  }
}

function playSoundFile(name, extension = 'mp3') {
  stop();
  const sound = new Sound(`${name}.${extension}`, Sound.MAIN_BUNDLE, error => {
    if (currentSound !== sound) {
      sound.release();
      return;
    }
    if (error) {
      console.warn(`Unable to load ${name}.${extension}. Check res/raw.`, error);
      stop();
      return;
    }
    sound.play(() => {
      if (currentSound === sound) {
        stop();
      }
    });
  });
  currentSound = sound;
}

export default {playSoundFile, stop};
