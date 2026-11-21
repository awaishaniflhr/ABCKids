// Addition Adventure: an endless run of short, countable sums with fruit
// pictures.

// A cheer (and a special sound) for every this-many sums solved in a row.
export const STREAK_CHEER = 5;
// The first questions stay small to warm up; later ones go up to 10 so every
// fruit still fits on screen and can be counted by tapping.
export const EASY_QUESTIONS = 2;
export const EASY_MAX = 5;
export const MAX_SUM = 10;

export const FRUITS = [
  { name: 'apple', plural: 'apples', image: require('../assets/apple.png') },
  { name: 'banana', plural: 'bananas', image: require('../assets/banana.png') },
  { name: 'orange', plural: 'oranges', image: require('../assets/orange.png') },
  {
    name: 'strawberry',
    plural: 'strawberries',
    image: require('../assets/strawberry.png'),
  },
  { name: 'grapes', plural: 'grapes', image: require('../assets/grape.png') },
  {
    name: 'watermelon',
    plural: 'watermelons',
    image: require('../assets/watermelon.png'),
  },
  {
    name: 'pineapple',
    plural: 'pineapples',
    image: require('../assets/pineapple.png'),
  },
];

const pick = (rng, count) => Math.min(count - 1, Math.floor(rng() * count));

function shuffle(items, rng) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index--) {
    const other = pick(rng, index + 1);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function answerOptions(sum, rng = Math.random) {
  const near = [sum - 1, sum + 1, sum - 2, sum + 2].filter(
    value => value >= 1 && value <= MAX_SUM + 2,
  );
  // Prefer the closest wrong answers, but mix which two appear.
  const wrong = shuffle(near.slice(0, 2), rng).concat(near.slice(2));
  return shuffle([sum, wrong[0], wrong[1]], rng);
}

export function makeQuestion(number, rng = Math.random, previous = null) {
  const max = number < EASY_QUESTIONS ? EASY_MAX : MAX_SUM;
  let a;
  let b;
  for (let attempt = 0; attempt < 12; attempt++) {
    const sum = 2 + pick(rng, max - 1); // 2..max
    a = 1 + pick(rng, sum - 1); // 1..sum-1
    b = sum - a;
    if (!previous || previous.a !== a || previous.b !== b) break;
  }
  if (previous && previous.a === a && previous.b === b) {
    // Unlucky draws: nudge to a neighbouring sum that still fits.
    if (a > 1) a -= 1;
    else if (a + b < max) b += 1;
    else b -= 1;
  }
  let fruit = pick(rng, FRUITS.length);
  if (previous && fruit === previous.fruit) fruit = (fruit + 1) % FRUITS.length;
  return {
    number,
    a,
    b,
    fruit,
    options: answerOptions(a + b, rng),
    wrong: [],
    answer: null,
    firstTry: true,
  };
}

// Applies a tapped answer. Wrong answers stay on screen, crossed out, so the
// child can see what they already tried.
export function chooseAnswer(question, value) {
  if (question.answer !== null || question.wrong.includes(value))
    return question;
  if (value === question.a + question.b) return { ...question, answer: value };
  return { ...question, wrong: [...question.wrong, value], firstTry: false };
}
