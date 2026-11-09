export const ROUND_SECONDS = 20;
export const TARGET_SCORE = 10;
export const MAX_BALLOONS = 8;
export const SPAWN_INTERVAL = 650;
export const BALLOON_TOUCH_PADDING = 20;

export function getDifficulty(secondsLeft) {
  return secondsLeft <= 8
    ? { bombChance: 0.24, flightMs: 4800 }
    : { bombChance: 0.18, flightMs: 5200 };
}

export function getDistractorLetters(letter) {
  const index = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(letter);
  return [1, 2].map(offset =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt((index + offset) % 26),
  );
}

export function getBalloonY(motion, now) {
  const progress = Math.min(
    1,
    Math.max(0, (now - motion.startedAt) / Math.max(1, motion.duration)),
  );
  return motion.startY + (motion.endY - motion.startY) * progress;
}

// Native-driven transforms can move beyond a child's native touch bounds.
// Resolve a board touch against the same flight timeline, without a JS frame loop.
export function findBalloonAtPoint(balloons, motions, point, now, ignoredIds) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (let index = balloons.length - 1; index >= 0; index--) {
    const item = balloons[index];
    const motion = motions.get(item.id);
    if (!motion || ignoredIds.has(item.id)) {
      continue;
    }
    const y = getBalloonY(motion, now);
    const dx = Math.abs(point.x - (item.x + item.size / 2));
    const dy = Math.abs(point.y - (y + item.size / 2));
    const radius = item.size / 2;
    // A visible balloon/bomb takes priority over another balloon's extra padding.
    if (dx <= radius && dy <= radius) {
      return item;
    }
    const padding = item.isBomb ? 0 : BALLOON_TOUCH_PADDING;
    const distance = dx * dx + dy * dy;
    if (
      dx <= radius + padding &&
      dy <= radius + padding &&
      distance < nearestDistance
    ) {
      nearest = item;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function createRound(roundId = 0) {
  return {
    roundId,
    status: 'playing',
    score: 0,
    streak: 0,
    bestStreak: 0,
    bombHits: 0,
    lastPop: null,
    timeLeft: ROUND_SECONDS,
    balloons: [],
  };
}

export function roundReducer(state, action) {
  if (action.type === 'reset') {
    return createRound(state.roundId + 1);
  }
  if (action.roundId !== state.roundId || state.status !== 'playing') {
    return state;
  }

  switch (action.type) {
    case 'spawn':
      if (state.balloons.length >= MAX_BALLOONS) {
        return state;
      }
      return { ...state, balloons: [...state.balloons, action.balloon] };
    case 'pop': {
      const balloon = state.balloons.find(item => item.id === action.id);
      if (!balloon) {
        return state;
      }
      const correct = !balloon.isBomb && balloon.isTarget;
      const streak = correct ? state.streak + 1 : 0;
      return {
        ...state,
        score: Math.max(0, state.score + (balloon.isBomb ? -1 : correct ? 1 : 0)),
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        bombHits: state.bombHits + (balloon.isBomb ? 1 : 0),
        lastPop: {
          id: balloon.id,
          isBomb: balloon.isBomb,
          isTarget: Boolean(correct),
          streak,
        },
        balloons: state.balloons.filter(item => item.id !== action.id),
      };
    }
    case 'expire':
      return {
        ...state,
        balloons: state.balloons.filter(item => item.id !== action.id),
      };
    case 'resize':
      return { ...state, balloons: [] };
    case 'tick':
      return state.timeLeft === action.seconds
        ? state
        : { ...state, timeLeft: action.seconds };
    case 'finish':
      return {
        ...state,
        timeLeft: 0,
        balloons: [],
        status: state.score >= TARGET_SCORE ? 'won' : 'lost',
      };
    default:
      return state;
  }
}
