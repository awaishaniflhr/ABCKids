// Play reminders: one local notification for the most recently left,
// unfinished game, cancelled on return, opened straight at the next item.

let reminders;
let progress;
let AsyncStorage;
let native;

function fakeNative() {
  let pending = null;
  return {
    pending: () => (pending ? JSON.parse(pending.data) : null),
    pendingCall: () => pending,
    opened: null,
    notify: true,
    schedule: jest.fn(async (at, title, body, data) => {
      pending = { at, title, body, data };
      return true;
    }),
    cancel: jest.fn(async () => {
      pending = null;
      return true;
    }),
    getPending: jest.fn(async () => (pending ? pending.data : null)),
    canNotify: jest.fn(async function () {
      return native.notify;
    }),
    consumeOpened: jest.fn(async () => {
      const data = native.opened;
      native.opened = null;
      return data;
    }),
  };
}

let permission;
beforeEach(() => {
  native = fakeNative();
  permission = jest.fn(async () => 'granted');
  jest.isolateModules(() => {
    jest.doMock('../src/services/nativeReminders', () => ({
      getPlayReminders: () => native,
      requestNotificationPermission: permission,
    }));
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.__reset?.();
    progress = require('../src/games/tracingProgress');
    reminders = require('../src/services/reminders');
  });
});

async function turnOn() {
  await reminders.setRemindersOn(true);
}

test('nothing is reminded while reminders are off (the default)', async () => {
  await reminders.initReminders();
  await reminders.leaveGame('letters');
  expect(native.schedule).not.toHaveBeenCalled();
});

test('turning on asks for notification permission and is remembered', async () => {
  await turnOn();
  expect(permission).toHaveBeenCalledTimes(1);
  expect(
    JSON.parse(await AsyncStorage.getItem('@abckids/reminders/v1/settings')),
  ).toEqual({
    enabled: true,
  });
});

test('permission refused: stays off with a message', async () => {
  permission.mockResolvedValue('blocked');
  await reminders.setRemindersOn(true);
  expect(reminders.getReminderSettings()).toMatchObject({
    enabled: false,
    blocked: true,
  });
  await reminders.leaveGame('letters');
  expect(native.schedule).not.toHaveBeenCalled();
});

test('leaving Letter Tracing at D reminds about D about 24 hours later', async () => {
  await turnOn();
  for (const letter of ['A', 'B', 'C']) await progress.saveTracingStar(letter);
  await reminders.leaveGame('letters', 1000);
  const call = native.pendingCall();
  expect(call.at).toBe(1000 + reminders.REMIND_AFTER_MS);
  expect(call.title).toBe('Ready to trace again?');
  expect(call.body).toBe('Your next letter is D!');
  expect(native.pending()).toEqual({ game: 'letters', item: 'D' });
});

test('switching to another unfinished game moves the one reminder there', async () => {
  await turnOn();
  for (const letter of ['A', 'B', 'C']) await progress.saveTracingStar(letter);
  await reminders.enterGame('letters');
  await reminders.leaveGame('letters');
  await reminders.enterGame('numbers'); // doesn't cancel the letters reminder
  expect(native.pending()).toEqual({ game: 'letters', item: 'D' });
  for (const n of ['1', '2', '3', '4', '5'])
    await progress.saveNumberTracingStar(n);
  await reminders.leaveGame('numbers');
  expect(native.pending()).toEqual({ game: 'numbers', item: '6' });
  expect(native.pendingCall().body).toBe('Your next number is 6!');
});

test('coming back to that game cancels its reminder', async () => {
  await turnOn();
  await reminders.leaveGame('words');
  expect(native.pending().game).toBe('words');
  await reminders.enterGame('words');
  expect(native.pending()).toBeNull();
});

test('a finished game sets no reminder', async () => {
  await turnOn();
  for (let n = 1; n <= 20; n++) await progress.saveNumberTracingStar(String(n));
  await reminders.leaveGame('numbers');
  expect(native.schedule).not.toHaveBeenCalled();
});

test('turning reminders off cancels the waiting one', async () => {
  await turnOn();
  await reminders.leaveGame('letters');
  expect(native.pending()).not.toBeNull();
  await reminders.setRemindersOn(false);
  expect(native.pending()).toBeNull();
});

test('tapping a reminder opens the game at the next item, Home underneath', async () => {
  native.opened = JSON.stringify({ game: 'numbers', item: '6' });
  expect(await reminders.consumeReminderTap()).toEqual([
    { name: 'Home' },
    { name: 'TracingNumbers' },
    { name: 'NumberTracing', params: { number: '6' } },
  ]);
  // Each tap is handled once.
  expect(await reminders.consumeReminderTap()).toBeNull();
});

test('word reminders open Word Tracing at that word', () => {
  const routes = reminders.routesForReminder(
    JSON.stringify({ game: 'words', item: 'Cat' }),
  );
  expect(routes[0]).toEqual({ name: 'Home' });
  expect(routes[1].name).toBe('WordTracing');
  expect(Number.isInteger(routes[1].params.index)).toBe(true);
});

test('unknown or broken reminder data is ignored', () => {
  expect(reminders.routesForReminder('nope')).toBeNull();
  expect(
    reminders.routesForReminder(JSON.stringify({ game: 'letters', item: '?' })),
  ).toBeNull();
  expect(
    reminders.routesForReminder(JSON.stringify({ game: 'chess', item: 'A' })),
  ).toBeNull();
});
