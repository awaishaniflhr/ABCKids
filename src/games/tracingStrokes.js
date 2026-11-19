// Shared helpers for building tracing stroke guides in a 400 x 400 space.
export const line = (...points) => points;
export const curve = (a, b, c, d) =>
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

export function makeStroke(raw) {
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
