export const ROUND_SECONDS = 20;
export const TARGET_SCORE = 10;
export const MAX_BALLOONS = 8;
export const SPAWN_INTERVAL = 650;
export const BALLOON_TOUCH_PADDING = 12;

export function getDifficulty(secondsLeft) {
  return secondsLeft <= 8
    ? { bombChance: 0.42, flightMs: 3900 }
    : { bombChance: 0.3, flightMs: 4800 };
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
      const streak = balloon.isBomb ? 0 : state.streak + 1;
      return {
        ...state,
        score: Math.max(0, state.score + (balloon.isBomb ? -1 : 1)),
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        bombHits: state.bombHits + (balloon.isBomb ? 1 : 0),
        lastPop: { id: balloon.id, isBomb: balloon.isBomb, streak },
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
