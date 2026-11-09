import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@abckids/letter-tracing/v1/stars';
let pending = Promise.resolve();
const parse = value => {
  try {
    const letters = JSON.parse(value);
    return Array.isArray(letters)
      ? [
          ...new Set(
            letters.filter(
              letter => typeof letter === 'string' && /^[A-Z]$/.test(letter),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
};

export async function readTracingStars() {
  await pending.catch(() => {});
  return parse(await AsyncStorage.getItem(KEY));
}
export function saveTracingStar(letter) {
  if (!/^[A-Z]$/.test(letter)) return Promise.resolve();
  const write = pending
    .catch(() => {})
    .then(async () => {
      const stars = parse(await AsyncStorage.getItem(KEY));
      if (!stars.includes(letter)) {
        await AsyncStorage.setItem(
          KEY,
          JSON.stringify([...stars, letter].sort()),
        );
      }
    });
  pending = write;
  return write;
}
