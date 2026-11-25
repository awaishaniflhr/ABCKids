import { useCallback, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// App-wide audio: background music for screens, plus the player's two
// on/off choices (music, tracing sounds), saved on the phone.
//
// - One music track plays at a time, so Home's tune and the tracing music
//   never overlap. Moving between screens that share a track (the tracing
//   list and the tracing game) keeps it playing without a restart.
// - All music pauses while the app is in the background and resumes when the
//   child comes back.

let Sound = null;
try {
  Sound = require('react-native-sound');
  Sound = Sound?.default ?? Sound;
} catch {
  Sound = null; // No audio this session; the app works the same.
}

// ---------------------------------------------------------------- settings
const SETTINGS_KEY = '@abckids/audio/v1/settings';
const DEFAULTS = { music: true, tracingSounds: true };
let settings = { ...DEFAULTS };
const listeners = new Set();

function notify() {
  listeners.forEach(listener => listener());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSettings() {
  return settings;
}
function persist() {
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
}

export function useAudioSettings() {
  return useSyncExternalStore(subscribe, getSettings);
}
export function isMusicOn() {
  return settings.music;
}
export function areTracingSoundsOn() {
  return settings.tracingSounds;
}
export function setMusicOn(on) {
  settings = { ...settings, music: Boolean(on) };
  persist();
  notify();
  sync();
}
export function setTracingSoundsOn(on) {
  settings = { ...settings, tracingSounds: Boolean(on) };
  persist();
  notify();
}

// ------------------------------------------------------------------ music
// Home: a playful tune. Tracing: calm and quiet so spoken instructions stay
// easy to hear.
export const TRACKS = {
  home: { file: 'music_home.mp3', volume: 0.35 },
  tracing: { file: 'music_tracing.mp3', volume: 0.13 },
};
// When a screen with music closes, wait this long before stopping it: if the
// next screen wants the same track, it simply keeps playing.
const HANDOVER_MS = 400;

let wanted = null; // the track the visible screen asked for
let current = null; // { name, sound, ready, playing }
let appActive = AppState.currentState !== 'background';
let handoverTimer = null;

function soundSource(file) {
  // react-native-sound 0.13 expects a path string on iOS and a resource name
  // on Android (same as the tracing sounds).
  return Platform.OS === 'ios'
    ? encodeURI(`file://${Sound.MAIN_BUNDLE}/${file}`)
    : file;
}

function release(player) {
  try {
    player.sound?.stop();
    player.sound?.release();
  } catch {
    // Already gone.
  }
}

function sync() {
  const target = settings.music && appActive ? wanted : null;
  // A different track was asked for (or none): stop the old one.
  if (current && current.name !== wanted) {
    release(current);
    current = null;
  }
  if (!target) {
    if (current?.playing) {
      current.sound.pause();
      current.playing = false;
    }
    return;
  }
  if (!Sound) return;
  if (!current) {
    const player = { name: target, ready: false, playing: false };
    current = player;
    try {
      player.sound = new Sound(
        soundSource(TRACKS[target].file),
        undefined,
        error => {
          if (current !== player) {
            release(player);
            return;
          }
          if (error) {
            current = null;
            return;
          }
          player.ready = true;
          player.sound.setNumberOfLoops(-1);
          player.sound.setVolume(TRACKS[target].volume);
          sync();
        },
      );
    } catch {
      current = null;
    }
    return;
  }
  if (current.ready && !current.playing) {
    current.playing = true;
    current.sound.play(() => {
      if (current) current.playing = false;
    });
  }
}

// Ask for `track` to play (it keeps playing if it already is).
export function playMusic(track) {
  clearTimeout(handoverTimer);
  handoverTimer = null;
  wanted = track;
  sync();
}

// The screen that asked for `track` closed. Stop it shortly, unless the next
// screen asks for it again first.
export function releaseMusic(track) {
  clearTimeout(handoverTimer);
  handoverTimer = setTimeout(() => {
    handoverTimer = null;
    if (wanted === track) {
      wanted = null;
      sync();
    }
  }, HANDOVER_MS);
}

// Plays `track` while the calling screen is on show.
export function useScreenMusic(track) {
  useFocusEffect(
    useCallback(() => {
      playMusic(track);
      return () => releaseMusic(track);
    }, [track]),
  );
}

// ---------------------------------------------------------------- startup
let started = false;

// Call once when the app starts: loads the saved choices and pauses music
// whenever the app goes to the background.
export function initAudio() {
  if (started) return;
  started = true;
  AsyncStorage.getItem(SETTINGS_KEY)
    .then(value => {
      const saved = value ? JSON.parse(value) : {};
      settings = {
        music: typeof saved.music === 'boolean' ? saved.music : true,
        tracingSounds:
          typeof saved.tracingSounds === 'boolean' ? saved.tracingSounds : true,
      };
      notify();
      sync();
    })
    .catch(() => {});
  AppState.addEventListener('change', state => {
    appActive = state === 'active';
    sync();
  });
}
