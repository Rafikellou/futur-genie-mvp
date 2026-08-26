// Futur Génie brand palette (visual identity pass, CLAUDE.md "Visual Identity
// Pass" instructions). Centralizes the primary purple used for buttons, links
// and selected states so it isn't repeated as a hex literal across screens.
//
// Deliberately small: this is a color-only token file, not a design system.
// Semantic colors (success green, danger red, warning amber) are NOT
// centralized here — they carry meaning (correct answer, error, destructive
// action) that must stay independent of the brand color and is unlikely to
// be reused enough to justify a shared token yet (CLAUDE.md §59).
export const COLORS = {
  primary: '#7C3AED',
  primaryPressed: '#6D28D9',
  primaryLight: '#F3E8FF',
  // Muted tint for a filled primary button in its disabled state (only the
  // public quiz screen fills a disabled button with a flat color instead of
  // the more common `opacity: 0.5` overlay used elsewhere in the app).
  primaryMuted: '#CBB3EC',
} as const;
