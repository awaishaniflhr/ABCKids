import { curve, line, makeStroke } from './tracingStrokes';

const oval = () =>
  Array.from({ length: 81 }, (_, index) => {
    const angle = -Math.PI / 2 + (index / 80) * Math.PI * 2;
    return [200 + Math.cos(angle) * 100, 200 + Math.sin(angle) * 120];
  });
const bowl = () => curve([120, 80], [335, 60], [335, 210], [120, 200]);

// These are original stroke guides, independent of font/device rendering.
// Coordinates and touch validation share one 400 x 400 drawing space.
const guides = {
  A: [
    line([200, 80], [105, 320]),
    line([200, 80], [295, 320]),
    line([145, 220], [255, 220]),
  ],
  B: [
    line([120, 80], [120, 320]),
    bowl(),
    curve([120, 200], [350, 180], [350, 340], [120, 320]),
  ],
  C: [
    [
      ...curve([295, 110], [235, 50], [90, 55], [98, 200]),
      ...curve([98, 200], [98, 335], [260, 350], [295, 290]),
    ],
  ],
  D: [
    line([120, 80], [120, 320]),
    curve([120, 80], [350, 65], [350, 335], [120, 320]),
  ],
  E: [
    line([120, 80], [120, 320]),
    line([120, 80], [280, 80]),
    line([120, 200], [250, 200]),
    line([120, 320], [280, 320]),
  ],
  F: [
    line([120, 80], [120, 320]),
    line([120, 80], [280, 80]),
    line([120, 200], [250, 200]),
  ],
  G: [
    [
      ...curve([295, 110], [235, 50], [90, 55], [98, 200]),
      ...curve([98, 200], [98, 335], [260, 350], [295, 275]),
      [295, 220],
      [225, 220],
    ],
  ],
  H: [
    line([115, 80], [115, 320]),
    line([285, 80], [285, 320]),
    line([115, 200], [285, 200]),
  ],
  I: [
    line([200, 80], [200, 320]),
    line([140, 80], [260, 80]),
    line([140, 320], [260, 320]),
  ],
  J: [
    line([145, 80], [285, 80]),
    [
      [245, 80],
      [245, 255],
      ...curve([245, 255], [245, 345], [105, 345], [105, 265]),
    ],
  ],
  K: [line([120, 80], [120, 320]), line([280, 80], [120, 210], [290, 320])],
  L: [line([120, 80], [120, 320], [280, 320])],
  M: [
    line([100, 80], [100, 320]),
    line([100, 80], [200, 225], [300, 80]),
    line([300, 80], [300, 320]),
  ],
  N: [
    line([110, 80], [110, 320]),
    line([110, 80], [290, 320]),
    line([290, 80], [290, 320]),
  ],
  O: [oval()],
  P: [line([120, 80], [120, 320]), bowl()],
  Q: [oval(), line([225, 265], [305, 345])],
  R: [line([120, 80], [120, 320]), bowl(), line([200, 200], [290, 320])],
  S: [
    [
      ...curve([285, 110], [210, 35], [70, 85], [115, 180]),
      ...curve([115, 180], [145, 225], [325, 185], [285, 285]),
      ...curve([285, 285], [255, 350], [125, 345], [100, 295]),
    ],
  ],
  T: [line([100, 80], [300, 80]), line([200, 80], [200, 320])],
  U: [
    [
      [110, 80],
      [110, 245],
      ...curve([110, 245], [110, 355], [290, 355], [290, 245]),
      [290, 80],
    ],
  ],
  V: [line([110, 80], [200, 320], [290, 80])],
  W: [line([85, 80], [135, 320], [200, 185], [265, 320], [315, 80])],
  X: [line([110, 80], [290, 320]), line([290, 80], [110, 320])],
  Y: [line([110, 80], [200, 200], [290, 80]), line([200, 200], [200, 320])],
  Z: [line([100, 80], [300, 80], [100, 320], [300, 320])],
};


export const TRACING_LETTERS = Object.entries(guides).map(
  ([letter, strokes]) => ({
    letter,
    strokes: strokes.map(makeStroke),
  }),
);
export const getTracingLetter = letter =>
  TRACING_LETTERS.find(item => item.letter === String(letter).toUpperCase()) ||
  TRACING_LETTERS[0];

export function pointOnStroke(stroke, distance) {
  const target = Math.min(stroke.length, Math.max(0, distance));
  for (let index = 1; index < stroke.points.length; index++) {
    const b = stroke.points[index];
    if (b.distance >= target) {
      const a = stroke.points[index - 1];
      const t = (target - a.distance) / (b.distance - a.distance);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return stroke.points[stroke.points.length - 1];
}

export const createTrace = () => ({
  strokeIndex: 0,
  progress: 0,
  drawing: false,
  lastPoint: null,
  complete: false,
  offTrack: false,
});
export const pauseTrace = state => ({
  ...state,
  drawing: false,
  lastPoint: null,
});

// ------------------------------------------------- forgiving for small kids
// Players are 3-10 years old, so a stroke doesn't demand pixel-perfect
// finishing:
// - it counts as done once the finger gets close to its end (END_SLACK);
// - lifting the finger with only a little left still finishes it (LIFT_SLACK);
// - after lifting, the finger can go back down anywhere on the part already
//   traced (even the first dot) and carry on.
// Both slacks grow with the stroke's length, within these limits (in the
// 400 x 400 drawing space).
const slack = (stroke, share, min, max) =>
  Math.min(max, Math.max(min, stroke.length * share));
const endSlack = stroke => slack(stroke, 0.1, 20, 40);
const liftSlack = stroke => slack(stroke, 0.18, 30, 60);

function finishStroke(state, strokes) {
  const strokeIndex = state.strokeIndex + 1;
  return {
    ...createTrace(),
    strokeIndex,
    complete: strokeIndex === strokes.length,
  };
}

// Where along the stroke is `point`, if it is on the part already traced
// (or at the current checkpoint)? Lets a child lift and put their finger back
// down anywhere they've drawn, even the first dot. Returns null when it isn't.
function onTracedPart(stroke, point, progress, tolerance) {
  const checkpoint = pointOnStroke(stroke, progress);
  if (Math.hypot(point.x - checkpoint.x, point.y - checkpoint.y) <= tolerance) {
    return progress;
  }
  return project(stroke, point, 0, progress, tolerance);
}

// Nearest position along the stroke to `point`, searching only the stretch
// between `from` and `to` (stroke distances), within `tolerance`.
function project(stroke, point, from, to, tolerance) {
  let best = null;
  let bestDistance = tolerance;
  for (let index = 1; index < stroke.points.length; index++) {
    const a = stroke.points[index - 1];
    const b = stroke.points[index];
    if (b.distance < from || a.distance > to) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.min(
      1,
      Math.max(
        0,
        ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy),
      ),
    );
    const distance = Math.hypot(point.x - a.x - dx * t, point.y - a.y - dy * t);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = a.distance + (b.distance - a.distance) * t;
    }
  }
  return best;
}

export function beginTrace(state, point, strokes, tolerance = 28) {
  if (state.complete) return state;
  const stroke = strokes[state.strokeIndex];
  const cursor = onTracedPart(stroke, point, state.progress, tolerance);
  if (cursor === null) {
    return { ...pauseTrace(state), offTrack: true };
  }
  return { ...state, drawing: true, lastPoint: point, cursor, offTrack: false };
}

// The finger lifted. A stroke that was nearly finished counts as finished;
// otherwise it waits, keeping the progress made so far.
export function releaseTrace(state, strokes) {
  if (state.complete) return state;
  const stroke = strokes[state.strokeIndex];
  if (
    state.drawing &&
    state.progress > 0 &&
    stroke.length - state.progress <= liftSlack(stroke)
  ) {
    return finishStroke(state, strokes);
  }
  return pauseTrace(state);
}

// `progress` is how much of the stroke has been traced (it never goes back);
// `cursor` is where the finger is along it right now, which can be behind
// `progress` when a child retraces part they've already drawn.
export function moveTrace(
  state,
  point,
  strokes,
  tolerance = 28,
  endRadius = 18,
) {
  if (state.complete) return state;
  if (!state.drawing) return beginTrace(state, point, strokes, tolerance);
  const stroke = strokes[state.strokeIndex];
  const from = state.lastPoint;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(point.x - from.x, point.y - from.y) / 8),
  );
  let progress = state.progress;
  let cursor = state.cursor ?? progress;
  for (let step = 1; step <= steps; step++) {
    const sample = {
      x: from.x + ((point.x - from.x) * step) / steps,
      y: from.y + ((point.y - from.y) * step) / steps,
    };
    const projected = project(
      stroke,
      sample,
      cursor - tolerance,
      cursor + 32,
      tolerance,
    );
    if (projected === null)
      return { ...pauseTrace(state), progress, offTrack: true };
    cursor = projected;
    progress = Math.max(progress, cursor);
    const end = stroke.points[stroke.points.length - 1];
    if (
      progress >= stroke.length - endSlack(stroke) ||
      (progress >= stroke.length - 8 &&
        Math.hypot(sample.x - end.x, sample.y - end.y) <= endRadius)
    ) {
      return finishStroke(state, strokes);
    }
  }
  return { ...state, progress, cursor, lastPoint: point, offTrack: false };
}

export const DEFAULT_BOX = { x: 0, y: 0, width: 400, height: 400 };

// Fits a drawing box (400 x 400 for single letters, wider for words) into the
// canvas, centred, and returns where the box's origin lands on screen.
export function canvasGeometry(width, height, box = DEFAULT_BOX) {
  const scale = Math.max(
    0.001,
    Math.min(width / box.width, height / box.height),
  );
  return {
    scale,
    left: (width - scale * box.width) / 2 - box.x * scale,
    top: (height - scale * box.height) / 2 - box.y * scale,
  };
}
export function canvasPoint(point, width, height, box = DEFAULT_BOX) {
  const { scale, left, top } = canvasGeometry(width, height, box);
  return { x: (point.x - left) / scale, y: (point.y - top) / scale };
}
