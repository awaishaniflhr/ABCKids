import AsyncStorage from '@react-native-async-storage/async-storage';

// Each tracing game saves the items a child has finished, on the phone, as
// soon as each one is done. Every game has its own store, so progress in one
// never touches another, and it survives leaving the game or closing the app.

function createStarStore(key, valid, compare) {
  let pending = Promise.resolve();
  const parse = value => {
    try {
      const items = JSON.parse(value);
      return Array.isArray(items)
        ? [
            ...new Set(
              items.filter(item => typeof item === 'string' && valid(item)),
            ),
          ]
        : [];
    } catch {
      return [];
    }
  };
  async function read() {
    await pending.catch(() => {});
    return parse(await AsyncStorage.getItem(key));
  }
  function save(item) {
    if (!valid(item)) return Promise.resolve();
    const write = pending
      .catch(() => {})
      .then(async () => {
        const stars = parse(await AsyncStorage.getItem(key));
        if (!stars.includes(item)) {
          await AsyncStorage.setItem(
            key,
            JSON.stringify([...stars, item].sort(compare)),
          );
        }
      });
    pending = write;
    return write;
  }
  return { read, save };
}

const letters = createStarStore('@abckids/letter-tracing/v1/stars', letter =>
  /^[A-Z]$/.test(letter),
);
const numbers = createStarStore(
  '@abckids/number-tracing/v1/stars',
  number => /^([1-9]|1[0-9]|20)$/.test(number),
  (a, b) => Number(a) - Number(b),
);
// Words are saved by the word itself (e.g. "Cat"), so progress still holds
// if the word list is reordered later.
const words = createStarStore('@abckids/word-tracing/v1/done', word =>
  /^[A-Za-z][A-Za-z -]*$/.test(word),
);

export const readTracingStars = letters.read;
export const saveTracingStar = letters.save;
export const readNumberTracingStars = numbers.read;
export const saveNumberTracingStar = numbers.save;
export const readWordTracingDone = words.read;
export const saveWordTracingDone = words.save;

// Where "Continue" should go: the first item, in the game's own order, that
// isn't finished yet. Null when nothing has been finished yet (nothing to
// continue) or when everything is finished.
export function nextUnfinished(items, done) {
  if (!done.length) return null;
  return items.find(item => !done.includes(item)) ?? null;
}
