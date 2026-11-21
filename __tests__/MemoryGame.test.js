import {
  LEVEL_PAIRS,
  boardColumns,
  flipCard,
  hideMismatch,
  isComplete,
  newMemoryGame,
  pairsFor,
} from '../src/games/memory';
import { FRUITS } from '../src/games/addition';

const counts = cards =>
  cards.reduce((all, card) => ({ ...all, [card]: (all[card] || 0) + 1 }), {});

describe('fruit memory', () => {
  it('deals two of each fruit, more pairs each level', () => {
    LEVEL_PAIRS.forEach((pairs, level) => {
      const game = newMemoryGame(level);
      expect(game.cards).toHaveLength(pairs * 2);
      Object.entries(counts(game.cards)).forEach(([fruit, count]) => {
        expect(FRUITS[fruit]).toBeTruthy();
        expect(count).toBe(2);
      });
    });
    expect(pairsFor(10)).toBe(LEVEL_PAIRS[LEVEL_PAIRS.length - 1]);
  });

  it('keeps a matching pair face up', () => {
    let game = { ...newMemoryGame(0), cards: [0, 1, 0, 1, 2, 2] };
    game = flipCard(game, 0);
    game = flipCard(game, 2);
    expect(game.solved).toEqual([0, 2]);
    expect(game.flipped).toEqual([]);
    expect(game.moves).toBe(1);
  });

  it('turns a wrong pair back over and ignores a third tap', () => {
    let game = { ...newMemoryGame(0), cards: [0, 1, 0, 1, 2, 2] };
    game = flipCard(game, 0);
    game = flipCard(game, 1);
    expect(game.flipped).toEqual([0, 1]);
    expect(flipCard(game, 4)).toBe(game);
    game = hideMismatch(game);
    expect(game.flipped).toEqual([]);
    expect(game.solved).toEqual([]);
  });

  it('is complete when every pair is found', () => {
    let game = { ...newMemoryGame(0), cards: [0, 0, 1, 1, 2, 2] };
    [0, 1, 2, 3, 4, 5].forEach(index => {
      game = flipCard(game, index);
    });
    expect(isComplete(game)).toBe(true);
    expect(game.moves).toBe(3);
  });

  it('picks columns that make the cards biggest', () => {
    expect(boardColumns(6, 360, 600, 10).columns).toBe(2);
    expect(boardColumns(6, 800, 300, 10).columns).toBe(3);
    expect(boardColumns(12, 800, 300, 10).columns).toBe(6);
  });
});
