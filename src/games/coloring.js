export const DRAWING_VERSION = 1;
const HISTORY_LIMIT = 60;
export const createColoring = (fills = {}) => ({ fills, past: [], future: [] });

export function coloringReducer(state, action) {
  if (action.type === 'load') return createColoring(action.fills);
  if (action.type === 'undo') {
    if (!state.past.length) return state;
    return {
      fills: state.past[state.past.length - 1],
      past: state.past.slice(0, -1),
      future: [state.fills, ...state.future],
    };
  }
  if (action.type === 'redo') {
    if (!state.future.length) return state;
    return {
      fills: state.future[0],
      past: [...state.past, state.fills].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
    };
  }
  let fills;
  if (action.type === 'fill') {
    if (state.fills[action.id] === action.color) return state;
    fills = { ...state.fills };
    if (action.color) fills[action.id] = action.color;
    else delete fills[action.id];
  } else if (action.type === 'clear') {
    if (!Object.keys(state.fills).length) return state;
    fills = {};
  } else return state;
  return {
    fills,
    past: [...state.past, state.fills].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export const drawingStorageKey = template =>
  `@abckids/region-colouring/v${DRAWING_VERSION}/${template.id}`;
export const serializeDrawing = (template, fills) =>
  JSON.stringify({ version: DRAWING_VERSION, templateId: template.id, fills });

export function parseDrawing(value, template) {
  if (!value) return {};
  const saved = JSON.parse(value);
  if (
    saved?.version !== DRAWING_VERSION ||
    saved.templateId !== template.id ||
    !saved.fills ||
    typeof saved.fills !== 'object' ||
    Array.isArray(saved.fills)
  ) {
    throw new Error('Unsupported saved drawing');
  }
  const fills = {};
  for (const region of template.regions) {
    const color = saved.fills[region.id];
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color))
      fills[region.id] = color;
  }
  return fills;
}
