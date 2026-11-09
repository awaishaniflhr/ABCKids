const line = (...points) => points;
const curve = (a, b, c, d) =>
  Array.from({ length: 33 }, (_, index) => {
    const t = index / 32;
    const u = 1 - t;
    return [0, 1].map(
      axis =>
        u ** 3 * a[axis] +
        3 * u * u * t * b[axis] +
        3 * u * t * t * c[axis] +
        t ** 3 * d[axis],
    );
  });
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

function makeStroke(raw) {
  const points = [{ x: raw[0][0], y: raw[0][1], distance: 0 }];
  for (let index = 1; index < raw.length; index++) {
    const [x, y] = raw[index];
    const previous = points[points.length - 1];
    const length = Math.hypot(x - previous.x, y - previous.y);
    const steps = Math.ceil(length / 6);
    for (let step = 1; step <= steps; step++) {
      points.push({
        x: previous.x + ((x - previous.x) * step) / steps,
        y: previous.y + ((y - previous.y) * step) / steps,
        distance: previous.distance + (length * step) / steps,
      });
    }
  }
  return {
    points,
    length: points[points.length - 1].distance,
    d: points
      .map(
        (point, index) =>
          `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(' '),
  };
}

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

export function beginTrace(state, point, strokes, tolerance = 28) {
  if (state.complete) return state;
  const checkpoint = pointOnStroke(strokes[state.strokeIndex], state.progress);
  if (Math.hypot(point.x - checkpoint.x, point.y - checkpoint.y) > tolerance) {
    return { ...pauseTrace(state), offTrack: true };
  }
  return { ...state, drawing: true, lastPoint: point, offTrack: false };
}

function project(stroke, point, progress, tolerance) {
  let best = null;
  let bestDistance = tolerance;
  for (let index = 1; index < stroke.points.length; index++) {
    const a = stroke.points[index - 1];
    const b = stroke.points[index];
    if (b.distance < progress - tolerance || a.distance > progress + 32)
      continue;
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

export function moveTrace(state, point, strokes, tolerance = 28) {
  if (state.complete) return state;
  if (!state.drawing) return beginTrace(state, point, strokes, tolerance);
  const stroke = strokes[state.strokeIndex];
  const from = state.lastPoint;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(point.x - from.x, point.y - from.y) / 8),
  );
  let progress = state.progress;
  for (let step = 1; step <= steps; step++) {
    const sample = {
      x: from.x + ((point.x - from.x) * step) / steps,
      y: from.y + ((point.y - from.y) * step) / steps,
    };
    const projected = project(stroke, sample, progress, tolerance);
    if (projected === null)
      return { ...pauseTrace(state), progress, offTrack: true };
    progress = Math.max(progress, projected);
    const end = stroke.points[stroke.points.length - 1];
    if (
      progress >= stroke.length - 8 &&
      Math.hypot(sample.x - end.x, sample.y - end.y) <= 18
    ) {
      const strokeIndex = state.strokeIndex + 1;
      return {
        ...createTrace(),
        strokeIndex,
        complete: strokeIndex === strokes.length,
      };
    }
  }
  return { ...state, progress, lastPoint: point, offTrack: false };
}

export function canvasGeometry(width, height) {
  const scale = Math.max(0.001, Math.min(width, height) / 400);
  return {
    scale,
    left: (width - scale * 400) / 2,
    top: (height - scale * 400) / 2,
  };
}
export function canvasPoint(point, width, height) {
  const { scale, left, top } = canvasGeometry(width, height);
  return { x: (point.x - left) / scale, y: (point.y - top) / scale };
}
