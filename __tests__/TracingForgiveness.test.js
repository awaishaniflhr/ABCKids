import {
  createTrace,
  getTracingLetter,
  moveTrace,
  pointOnStroke,
  releaseTrace,
} from '../src/games/tracingLetters';

// Moves a finger along `stroke` from `from` to `to` (distances along it).
function drag(state, strokes, stroke, from, to) {
  let next = state;
  for (let distance = from; distance <= to; distance += 5) {
    next = moveTrace(next, pointOnStroke(stroke, distance), strokes);
  }
  return moveTrace(next, pointOnStroke(stroke, to), strokes);
}

describe('tracing is forgiving for small children', () => {
  const { strokes } = getTracingLetter('L');
  const [first] = strokes;

  it('finishes a stroke when the finger gets close to its end', () => {
    const state = drag(createTrace(), strokes, first, 0, first.length - 18);
    expect(state.strokeIndex).toBe(1);
  });

  it('finishes a nearly done stroke when the finger lifts early', () => {
    const almost = drag(createTrace(), strokes, first, 0, first.length - 45);
    expect(almost.strokeIndex).toBe(0);
    expect(releaseTrace(almost, strokes).strokeIndex).toBe(1);
  });

  it('does not finish a stroke lifted far from its end', () => {
    const half = drag(createTrace(), strokes, first, 0, first.length / 2);
    const lifted = releaseTrace(half, strokes);
    expect(lifted.strokeIndex).toBe(0);
    expect(lifted.progress).toBeCloseTo(half.progress);
  });

  it('lets a child lift and carry on from the first dot again', () => {
    const half = drag(createTrace(), strokes, first, 0, first.length / 2);
    const lifted = releaseTrace(half, strokes);
    const resumed = moveTrace(lifted, pointOnStroke(first, 0), strokes);
    expect(resumed.offTrack).toBe(false);
    expect(resumed.drawing).toBe(true);
    const done = drag(resumed, strokes, first, 0, first.length);
    expect(done.strokeIndex).toBe(1);
  });

  it('still ignores a touch far away from the stroke', () => {
    const far = moveTrace(createTrace(), { x: 390, y: 10 }, strokes);
    expect(far.offTrack).toBe(true);
    expect(far.progress).toBe(0);
  });
});
