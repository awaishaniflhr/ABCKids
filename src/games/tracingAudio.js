import { Platform } from 'react-native';
import Sound from 'react-native-sound';

export const TRACING_IDLE_MS = 110;

export function createTracingAudio() {
  let released = false;
  let moving = false;
  let idleTimer;
  let successPending = false;
  const loop = { ready: false, playing: false };
  const success = { ready: false, playing: false };

  function play(player) {
    if (released || !player.ready || player.playing) return;
    player.playing = true;
    player.sound.play(() => {
      player.playing = false;
    });
  }
  function load(player, filename, loops, volume) {
    // react-native-sound 0.13 expects a string, not Metro's numeric asset ID.
    // Native resources keep this interaction independent of Wi-Fi/Metro.
    const source =
      Platform.OS === 'ios'
        ? encodeURI(`file://${Sound.MAIN_BUNDLE}/${filename}`)
        : filename;
    try {
      player.sound = new Sound(source, undefined, error => {
        if (released) {
          player.sound?.release();
          return;
        }
        if (error) return;
        player.ready = true;
        player.sound.setNumberOfLoops(loops);
        player.sound.setVolume(volume);
        if (player === loop ? moving : successPending) play(player);
      });
    } catch {
      // Tracing remains usable on devices without a working audio output.
    }
  }
  load(loop, 'tracing_loop.wav', -1, 0.45);
  load(success, 'tracing_success.wav', 0, 0.7);

  function stop() {
    moving = false;
    clearTimeout(idleTimer);
    idleTimer = undefined;
    if (loop.ready && loop.playing) loop.sound.pause();
    loop.playing = false;
  }
  function reset() {
    stop();
    successPending = false;
    if (success.ready && success.playing) success.sound.stop();
    success.playing = false;
  }
  return {
    move() {
      if (released) return;
      moving = true;
      clearTimeout(idleTimer);
      // A stationary finger generates no move events. Silence that case too.
      idleTimer = setTimeout(stop, TRACING_IDLE_MS);
      play(loop);
    },
    stop,
    reset,
    celebrate() {
      if (released) return;
      stop();
      successPending = true;
      play(success);
    },
    release() {
      if (released) return;
      reset();
      released = true;
      for (const player of [loop, success]) {
        if (player.ready) player.sound.release();
      }
    },
  };
}
