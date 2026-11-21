import { curve, line, makeStroke } from './tracingStrokes';
import { TRACING_LETTERS } from './tracingLetters';

// Lowercase guides share the uppercase letters' vertical metrics:
//   ascender / cap top y = 80, x-height top y = 180,
//   baseline y = 320, descender y ~ 410.
// Horizontal positions are local; words lay glyphs out by their bounds.
const arc = (cx, cy, rx, ry, from, to, steps = 64) =>
  Array.from({ length: steps + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / steps;
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
  });
const Q = Math.PI / 4;
// A counter-clockwise ring starting at its upper right (for a, d, g, o, q).
const ring = () => arc(65, 250, 65, 70, -Q, -Q - Math.PI * 2, 80);
// A clockwise bowl starting on its left edge (for b, p).
const bowl = () => arc(65, 250, 65, 70, Math.PI, Math.PI * 3, 80);
const dot = x => line([x, 112], [x, 128]);

const lower = {
  a: [ring(), line([130, 180], [130, 320])],
  b: [line([0, 80], [0, 320]), bowl()],
  c: [arc(70, 250, 65, 70, -Q, -7 * Q)],
  d: [ring(), line([130, 80], [130, 320])],
  e: [[[5, 250], [135, 250], ...arc(70, 250, 65, 70, 0, -7 * Q)]],
  f: [
    [...curve([120, 100], [95, 70], [45, 72], [45, 135]), [45, 320]],
    line([0, 180], [100, 180]),
  ],
  g: [
    ring(),
    [
      [130, 180],
      [130, 365],
      ...curve([130, 365], [130, 425], [20, 425], [8, 380]),
    ],
  ],
  h: [
    line([0, 80], [0, 320]),
    [...curve([0, 240], [10, 170], [130, 165], [130, 240]), [130, 320]],
  ],
  i: [line([0, 180], [0, 320]), dot(0)],
  j: [
    [
      [60, 180],
      [60, 365],
      ...curve([60, 365], [60, 425], [-20, 425], [-30, 380]),
    ],
    dot(60),
  ],
  k: [line([0, 80], [0, 320]), line([115, 180], [0, 260], [120, 320])],
  l: [line([0, 80], [0, 320])],
  m: [
    line([0, 180], [0, 320]),
    [...curve([0, 235], [5, 170], [100, 170], [100, 235]), [100, 320]],
    [...curve([100, 235], [105, 170], [200, 170], [200, 235]), [200, 320]],
  ],
  n: [
    line([0, 180], [0, 320]),
    [...curve([0, 240], [10, 170], [130, 165], [130, 240]), [130, 320]],
  ],
  o: [ring()],
  p: [line([0, 180], [0, 410]), bowl()],
  q: [ring(), line([130, 180], [130, 410])],
  r: [line([0, 180], [0, 320]), curve([0, 245], [10, 180], [85, 170], [115, 200])],
  s: [
    [
      ...curve([120, 200], [90, 170], [10, 175], [20, 220]),
      ...curve([20, 220], [30, 255], [135, 240], [125, 285]),
      ...curve([125, 285], [115, 335], [20, 330], [0, 295]),
    ],
  ],
  t: [
    [[50, 100], [50, 280], ...curve([50, 280], [50, 330], [100, 330], [115, 300])],
    line([0, 180], [105, 180]),
  ],
  u: [
    [[0, 180], [0, 250], ...curve([0, 250], [0, 335], [130, 335], [130, 250]), [130, 180]],
    line([130, 180], [130, 320]),
  ],
  v: [line([0, 180], [65, 320], [130, 180])],
  w: [line([0, 180], [45, 320], [95, 210], [145, 320], [190, 180])],
  x: [line([0, 180], [125, 320]), line([125, 180], [0, 320])],
  y: [line([0, 180], [65, 320]), line([130, 180], [65, 320], [25, 410])],
  z: [line([0, 180], [125, 180], [0, 320], [125, 320])],
  '-': [line([0, 250], [80, 250])],
};

const GLYPHS = {
  ...Object.fromEntries(TRACING_LETTERS.map(item => [item.letter, item.strokes])),
  ...Object.fromEntries(
    Object.entries(lower).map(([char, strokes]) => [char, strokes.map(makeStroke)]),
  ),
};

// The gap between neighbouring glyphs' centre lines. The painted letters are
// 57 units thick, so this leaves a clear gap between their outlines.
const LETTER_GAP = 88;
const PAD_X = 45;
// A fixed vertical window keeps every word's baseline in the same place.
const BOX_TOP = 38;
const BOX_BOTTOM = 445;

function shiftStroke(stroke, dx, extra) {
  const points = stroke.points.map(point => ({ ...point, x: point.x + dx }));
  return {
    ...stroke,
    ...extra,
    points,
    d: points
      .map(
        (point, index) =>
          `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(' '),
  };
}

export function buildWordTemplate(word) {
  const strokes = [];
  const letters = [];
  let cursor = PAD_X;
  [...word].forEach((char, letterIndex) => {
    const glyph = GLYPHS[char];
    if (!glyph) throw new Error(`No tracing guide for "${char}"`);
    const xs = glyph.flatMap(stroke => stroke.points.map(point => point.x));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const dx = cursor - minX;
    const first = strokes.length;
    glyph.forEach((stroke, index) =>
      strokes.push(shiftStroke(stroke, dx, { letterIndex, number: index + 1 })),
    );
    letters.push({ char, first, last: strokes.length - 1 });
    cursor += maxX - minX + LETTER_GAP;
  });
  const width = cursor - LETTER_GAP + PAD_X;
  return {
    letter: word,
    word,
    strokes,
    letters,
    box: { x: 0, y: BOX_TOP, width, height: BOX_BOTTOM - BOX_TOP },
  };
}

// Short, picture-friendly words so letters stay big enough to trace on a
// phone held either way.
const WORD_LIST = [
  ['Apple', require('../assets/apple.png')],
  ['Ball', require('../assets/ball.png')],
  ['Cat', require('../assets/cat.png')],
  ['Dog', require('../assets/dog.png')],
  ['Egg'],
  ['Fish', require('../assets/fish.png')],
  ['Goat', require('../assets/goat.png')],
  ['Horse', require('../assets/horse.png')],
  ['Igloo'],
  ['Jelly', require('../assets/jelly.png')],
  ['Key', require('../assets/key.png')],
  ['Lion', require('../assets/lion.png')],
  ['Moon'],
  ['Nut', require('../assets/nut.png')],
  ['Owl', require('../assets/owl.png')],
  ['Pig'],
  ['Quack', require('../assets/quack.png')],
  ['Rain', require('../assets/rain.png')],
  ['Sun', require('../assets/sun.png')],
  ['Tiger', require('../assets/tiger.png')],
  ['Up'],
  ['Van', require('../assets/van.png')],
  ['Wolf', require('../assets/wolf.png')],
  ['X-ray'],
  ['Yak', require('../assets/yak.png')],
  ['Zoo'],
];

export const TRACING_WORDS = WORD_LIST.map(([word, image]) => ({
  ...buildWordTemplate(word),
  image: image || null,
}));
