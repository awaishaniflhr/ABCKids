import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  readNumberTracingStars,
  readTracingStars,
  readWordTracingDone,
} from '../games/tracingProgress';
import { TRACING_LETTERS } from '../games/tracingLetters';
import { TRACING_NUMBERS } from '../games/tracingNumbers';
import { TRACING_WORDS } from '../games/tracingWords';
import {
  getPlayReminders,
  requestNotificationPermission,
} from './nativeReminders';

// Play reminders: one gentle, local notification about the game a child
// most recently left unfinished.
//
// - Leaving a game (going back, or the app going to the background) sets the
//   reminder for about 24 hours later, pointing at the next unfinished item.
//   Leaving another game unfinished moves the reminder to that game.
// - Coming back to that game before then cancels it.
// - Tapping it opens the game straight at that item.
// - Parents turn it on in Settings (off by default). Everything happens on
//   the phone, so it works offline.
export const REMIND_AFTER_MS = 24 * 60 * 60 * 1000;
const SETTINGS_KEY = '@abckids/reminders/v1/settings';

// Every game that saves progress. To add one, give it an entry here and call
// usePlayReminder('<key>', active) on its game screen.
const GAMES = {
  letters: {
    items: TRACING_LETTERS.map(item => item.letter),
    read: readTracingStars,
    noun: 'letter',
    routes: letter => [
      { name: 'TracingLetters' },
      { name: 'LetterTracing', params: { letter } },
    ],
  },
  numbers: {
    items: TRACING_NUMBERS.map(item => item.letter),
    read: readNumberTracingStars,
    noun: 'number',
    routes: number => [
      { name: 'TracingNumbers' },
      { name: 'NumberTracing', params: { number } },
    ],
  },
  words: {
    items: TRACING_WORDS.map(item => item.word),
    read: readWordTracingDone,
    noun: 'word',
    routes: word => [
      {
        name: 'WordTracing',
        params: {
          index: TRACING_WORDS.findIndex(item => item.word === word),
        },
      },
    ],
  },
};

const native = getPlayReminders;

// Whether this build can show reminders (the Settings switch hides if not).
export function remindersAvailable() {
  return Boolean(native());
}

// ------------------------------------------------------------------ state
// message: shown under the Settings switch (e.g. notifications blocked).
let state = { enabled: false, busy: false, message: null, blocked: false };
const listeners = new Set();
function update(changes) {
  state = { ...state, ...changes };
  listeners.forEach(listener => listener());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const getState = () => state;
export const getReminderSettings = getState;

export function useReminderSettings() {
  return useSyncExternalStore(subscribe, getState);
}

// Reminder work runs one step at a time, in order, so a quick "leave one
// letter, open the next" never ends with the wrong reminder left waiting.
let queue = Promise.resolve();
function enqueue(task) {
  const run = queue.then(task).catch(() => {});
  queue = run;
  return run;
}

let loaded = null;
export function initReminders() {
  loaded ??= AsyncStorage.getItem(SETTINGS_KEY)
    .then(value => {
      if (value && JSON.parse(value)?.enabled === true) {
        update({ enabled: true });
      }
    })
    .catch(() => {});
  return loaded;
}

// The first item, in the game's order, that isn't finished yet.
export function firstUnfinished(items, done) {
  return items.find(item => !done.includes(item)) ?? null;
}

export function reminderText(game, item) {
  return {
    title: 'Ready to trace again?',
    body: `Your next ${GAMES[game].noun} is ${item}!`,
  };
}

async function pendingGame() {
  try {
    const data = await native().getPending();
    return data ? JSON.parse(data)?.game ?? null : null;
  } catch {
    return null;
  }
}

// A child opened (or came back to) a game: if the waiting reminder is
// about this game, it isn't needed any more.
export function enterGame(game) {
  return enqueue(async () => {
    if (!native() || !GAMES[game]) return;
    if ((await pendingGame()) === game) await native().cancel();
  });
}

// A child left a game: remind them about it later, unless it's all done.
export function leaveGame(game, now = Date.now()) {
  return enqueue(async () => {
    await initReminders();
    if (!native() || !GAMES[game] || !state.enabled) return;
    const { items, read } = GAMES[game];
    const next = firstUnfinished(items, await read());
    if (!next) {
      if ((await pendingGame()) === game) await native().cancel();
      return;
    }
    const { title, body } = reminderText(game, next);
    await native().schedule(
      now + REMIND_AFTER_MS,
      title,
      body,
      JSON.stringify({ game, item: next }),
    );
  });
}

// --------------------------------------------------------------- settings
function saveEnabled(enabled) {
  return AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ enabled })).catch(
    () => {},
  );
}

// Turning on asks for permission to show notifications first.
// Turning off cancels any waiting reminder.
export async function setRemindersOn(on) {
  if (!native()) return;
  if (!on) {
    update({ enabled: false, message: null, blocked: false });
    await saveEnabled(false);
    await enqueue(() => native().cancel());
    return;
  }
  update({ busy: true, message: null, blocked: false });
  let permission = 'denied';
  try {
    permission = await requestNotificationPermission();
  } catch {
    permission = 'denied';
  }
  if (permission === 'granted') {
    update({ enabled: true, busy: false });
    await saveEnabled(true);
  } else {
    update({
      enabled: false,
      busy: false,
      blocked: permission === 'blocked',
      message:
        permission === 'blocked'
          ? 'Notifications are turned off for ABC Kids. Turn them on in the phone’s settings, then try again.'
          : 'Reminders need permission to show notifications.',
    });
  }
}

export function clearReminderMessage() {
  if (state.message) update({ message: null, blocked: false });
}

// ------------------------------------------------------ opening from a tap
// If the app was opened from a reminder, returns the screens to show
// (Home underneath, so Back still works), or null.
export async function consumeReminderTap() {
  if (!native()) return null;
  let data = null;
  try {
    data = await native().consumeOpened();
  } catch {
    return null;
  }
  return routesForReminder(data);
}

export function routesForReminder(data) {
  try {
    const { game, item } = JSON.parse(data);
    const entry = GAMES[game];
    if (!entry || !entry.items.includes(item)) return null;
    return [{ name: 'Home' }, ...entry.routes(item)];
  } catch {
    return null;
  }
}

// For a game screen: while the child is playing (screen shown and app open)
// the reminder about this game is cancelled; when they stop, it is set.
export function usePlayReminder(game, active) {
  useEffect(() => {
    if (!game || !active) return undefined;
    enterGame(game);
    return () => {
      leaveGame(game);
    };
  }, [game, active]);
}
