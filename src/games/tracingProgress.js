import AsyncStorage from '@react-native-async-storage/async-storage';

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
  number => /^([1-9]|10)$/.test(number),
  (a, b) => Number(a) - Number(b),
);

export const readTracingStars = letters.read;
export const saveTracingStar = letters.save;
export const readNumberTracingStars = numbers.read;
export const saveNumberTracingStar = numbers.save;
