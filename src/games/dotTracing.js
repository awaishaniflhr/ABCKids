import { pointOnStroke, TRACING_LETTERS } from './tracingLetters';

// Dot Tracing turns each letter's stroke guide into a row of dots. The child
// draws freely with a "paint pen"; dots light up in stroke order as the pen
// passes over them, and the letter is done once every dot is lit.

export const DOT_SPACING = 34;
export const DOT_RADIUS = 14;
// The board shows the letter between three writing lines (top, middle,
// baseline) with room on each side for the direction arrows.
export const DOT_BOX = { x: 20, y: 18, width: 360, height: 364 };
export const WRITING_LINES = [80, 200, 320];

function arrowFor(stroke, centre) {
  const along = Math.min(stroke.length / 2, 40);
  const a = pointOnStroke(stroke, Math.max(0, along - 10));
  const b = pointOnStroke(stroke, along + 10);
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const dx = (b.x - a.x) / length;
  const dy = (b.y - a.y) / length;
  const base = pointOnStroke(stroke, along);
  // Sit the arrow beside the stroke, on the side away from the letter.
  const sides = [
    { x: base.x - dy * 38, y: base.y + dx * 38 },
    { x: base.x + dy * 38, y: base.y - dx * 38 },
  ];
  const away = sides.reduce((best, side) =>
    Math.hypot(side.x - centre.x, side.y - centre.y) >
    Math.hypot(best.x - centre.x, best.y - centre.y)
      ? side
      : best,
  );
  return { ...away, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

export function buildDotLetter(template) {
  const all = template.strokes.flatMap(stroke => stroke.points);
  const centre = {
    x: all.reduce((sum, point) => sum + point.x, 0) / all.length,
    y: all.reduce((sum, point) => sum + point.y, 0) / all.length,
  };
  const placed = [];
  const strokes = template.strokes
    .map(stroke => {
      const gaps = Math.max(1, Math.round(stroke.length / DOT_SPACING));
      const dots = [];
      for (let index = 0; index <= gaps; index++) {
        const point = pointOnStroke(stroke, (stroke.length * index) / gaps);
        // Strokes that start on another stroke (B, E, P ...) or loops that
        // end where they began share a dot instead of stacking two.
        if (
          placed.some(
            dot =>
              Math.hypot(dot.x - point.x, dot.y - point.y) < DOT_SPACING * 0.6,
          )
        )
          continue;
        const dot = { x: point.x, y: point.y };
        placed.push(dot);
        dots.push(dot);
      }
      return { dots, arrow: arrowFor(stroke, centre) };
    })
    .filter(stroke => stroke.dots.length > 0);
  return { letter: template.letter, strokes };
}

export const DOT_LETTERS = TRACING_LETTERS.map(buildDotLetter);

export const createDotTrace = () => ({
  strokeIndex: 0,
  filled: 0,
  complete: false,
});

// Lights the next dot of the current stroke when the pen is over it. The pen
// may skip up to `lookahead` dots so a slightly wobbly line still counts.
export function fillDots(state, letter, point, radius, lookahead = 1) {
  if (state.complete) return state;
  const dots = letter.strokes[state.strokeIndex].dots;
  let filled = state.filled;
  for (let step = 0; step <= lookahead && filled + step < dots.length; step++) {
    const dot = dots[filled + step];
    if (Math.hypot(point.x - dot.x, point.y - dot.y) <= radius) {
      filled += step + 1;
      break;
    }
  }
  if (filled === state.filled) return state;
  if (filled < dots.length) return { ...state, filled };
  const strokeIndex = state.strokeIndex + 1;
  return strokeIndex >= letter.strokes.length
    ? { strokeIndex: letter.strokes.length, filled: 0, complete: true }
    : { strokeIndex, filled: 0, complete: false };
}

// Runs a pen movement through fillDots in small steps so a fast swipe cannot
// jump over dots.
export function drawDots(state, letter, from, to, radius) {
  const start = from || to;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - start.x, to.y - start.y) / 6),
  );
  let next = state;
  for (let step = 1; step <= steps; step++) {
    const sample = {
      x: start.x + ((to.x - start.x) * step) / steps,
      y: start.y + ((to.y - start.y) * step) / steps,
    };
    let previous;
    do {
      previous = next;
      next = fillDots(next, letter, sample, radius);
    } while (next !== previous && !next.complete);
  }
  return next;
}

export const isDotFilled = (state, strokeIndex, dotIndex) =>
  state.complete ||
  strokeIndex < state.strokeIndex ||
  (strokeIndex === state.strokeIndex && dotIndex < state.filled);
