// Shared "frosted glass" look: a see-through baby pink that matches the pink
// at the top of the app's backgrounds. Used by Home's floating header and the
// title pill on every game screen.
export const GLASS_PINK = 'rgba(255, 209, 228, 0.8)';

// A glass pill that hugs a screen title (and its subtitle) so it stays
// readable on any background. `marginRight: 'auto'` keeps anything after it
// in the header (a badge, a score) pushed to the right edge.
export const glassTitlePill = {
  flexShrink: 1,
  marginRight: 'auto',
  backgroundColor: GLASS_PINK,
  borderRadius: 18,
  paddingHorizontal: 14,
  paddingVertical: 5,
};
