import { FRUITS } from './addition';

// Pairs on the board for each level; after the last level it stays there.
export const LEVEL_PAIRS = [4, 5]; // 8 cards, then 10
export const MISMATCH_MS = 1000;

export const pairsFor = level =>
  LEVEL_PAIRS[Math.min(level, LEVEL_PAIRS.length - 1)];

function shuffle(items, rng) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A shuffled board of fruit pairs. Each card is the index of its fruit in
// FRUITS.
export function newMemoryGame(level = 0, rng = Math.random) {
  const fruits = shuffle(
    FRUITS.map((_, index) => index),
    rng,
  ).slice(0, pairsFor(level));
  return {
    level,
    cards: shuffle([...fruits, ...fruits], rng),
    flipped: [],
    solved: [],
    moves: 0,
  };
}

// Turns over card `index`. Returns the same state when the tap is ignored
// (two cards already up, or the card is already showing).
export function flipCard(state, index) {
  if (
    state.flipped.length === 2 ||
    state.flipped.includes(index) ||
    state.solved.includes(index)
  ) {
    return state;
  }
  const flipped = [...state.flipped, index];
  if (flipped.length < 2) return { ...state, flipped };
  const match = state.cards[flipped[0]] === state.cards[flipped[1]];
  return {
    ...state,
    moves: state.moves + 1,
    flipped: match ? [] : flipped,
    solved: match ? [...state.solved, ...flipped] : state.solved,
  };
}

export const hideMismatch = state => ({ ...state, flipped: [] });

export const isComplete = state => state.solved.length === state.cards.length;

// Columns that make the cards as big as possible in the given space.
export function boardColumns(count, width, height, gap = 10) {
  let best = { columns: 2, size: 0 };
  for (let columns = 2; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const size = Math.min(
      (width - (columns - 1) * gap) / columns,
      (height - (rows - 1) * gap) / rows,
    );
    if (size > best.size) best = { columns, size };
  }
  return best;
}
