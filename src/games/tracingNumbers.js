import { curve, line, makeStroke } from './tracingStrokes';

// Points around an ellipse. Angles are in screen space (0 = right, y grows
// downward), so a decreasing angle runs counter-clockwise on screen.
const arc = (cx, cy, rx, ry, from, to, steps = 64) =>
  Array.from({ length: steps + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / steps;
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
  });

// A vertical figure eight: start at the top, swing left and down through the
// middle, round the bottom, then cross back up to the top.
const eight = () =>
  Array.from({ length: 121 }, (_, index) => {
    const t = (index / 120) * Math.PI * 2;
    return [200 - Math.sin(t) * Math.cos(t) * 170, 200 - Math.cos(t) * 120];
  });

// Original stroke guides in the same 400 x 400 space as the letters.
const guides = {
  1: [line([160, 125], [215, 80], [215, 320])],
  2: [
    [
      ...curve([115, 140], [125, 55], [300, 55], [275, 165]),
      [115, 320],
      [290, 320],
    ],
  ],
  3: [
    [
      ...curve([120, 110], [210, 35], [330, 115], [200, 195]),
      ...curve([200, 195], [345, 215], [290, 375], [110, 300]),
    ],
  ],
  4: [line([235, 80], [100, 250], [300, 250]), line([240, 80], [240, 320])],
  5: [
    [
      [135, 80],
      [125, 190],
      ...curve([125, 190], [335, 140], [325, 355], [110, 300]),
    ],
    line([135, 80], [285, 80]),
  ],
  6: [
    [
      ...curve([270, 95], [160, 55], [95, 170], [105, 250]),
      ...curve([105, 250], [115, 350], [290, 345], [285, 255]),
      ...curve([285, 255], [280, 170], [130, 170], [107, 240]),
    ],
  ],
  7: [line([110, 80], [290, 80], [170, 320])],
  8: [eight()],
  9: [[...arc(195, 150, 80, 70, 0, -Math.PI * 2), [275, 320]]],
  10: [
    line([95, 120], [130, 80], [130, 320]),
    arc(265, 200, 65, 120, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2),
  ],
};

// `letter` holds the glyph so the shared tracing canvas and round can treat
// numbers exactly like letters.
export const TRACING_NUMBERS = Object.entries(guides)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([number, strokes]) => ({
    letter: number,
    strokes: strokes.map(makeStroke),
  }));

export const getTracingNumber = number =>
  TRACING_NUMBERS.find(item => item.letter === String(number)) ||
  TRACING_NUMBERS[0];
