export function gridLayout(width, minWidth = 120, maxColumns = 6, gap = 12) {
  const available = Math.max(1, width);
  const columns = Math.max(
    1,
    Math.min(maxColumns, Math.floor((available + gap) / (minWidth + gap))),
  );
  return {
    columns,
    cellWidth: (available - gap * (columns - 1)) / columns,
    gap,
  };
}

export function containsPoint(bounds, point) {
  return (
    bounds.width > 0 &&
    bounds.height > 0 &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function isDropInside(ref, point) {
  return new Promise(resolve => {
    if (!ref?.measureInWindow) {
      resolve(false);
      return;
    }
    // A view can disappear mid-gesture during rotation or navigation.
    const timeout = setTimeout(() => resolve(false), 250);
    ref.measureInWindow((x, y, width, height) => {
      clearTimeout(timeout);
      resolve(containsPoint({ x, y, width, height }, point));
    });
  });
}
