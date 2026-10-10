import { colors } from './colors';

// Props for expo-linear-gradient's <LinearGradient> (docs/design/README §3.2).
// `start`/`end` reproduce the CSS angles of the mockups: 135° = top-left to
// bottom-right, 90° = left to right.
type Gradient = {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export const gradients = {
  hero: {
    colors: [colors.brandBlue, colors.brandViolet, colors.brandMagenta],
    locations: [0, 0.52, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  primaryButton: {
    colors: [colors.brandRaspberry, colors.brandPurple],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  // Selected chip, active tab, step bar.
  selected: {
    colors: [colors.brandBlue, colors.brandViolet],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  // Student progress bar ("x / n répondues").
  progress: {
    colors: [colors.brandBlue, colors.brandViolet, colors.brandRaspberry],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  // Bottom fade behind a sticky footer button, so content scrolling under it
  // dissolves into the background instead of being cut by a hard edge.
  footerFade: {
    colors: [colors.backgroundTransparent, colors.background],
    locations: [0, 0.35],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  // Warm accent tiles (Suggestions header, "Merci !" confirmation).
  warm: {
    colors: [colors.brandPeach, colors.brandRaspberry],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  warmHero: {
    colors: [colors.brandPeach, colors.brandRaspberry, colors.brandViolet],
    locations: [0, 0.55, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Soft icon tile behind a list-row icon.
  iconTile: {
    colors: [colors.tint.blue.background, colors.tint.pink.background],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const satisfies Record<string, Gradient>;

// Blue → magenta → orange progression: the 3 step-bar segments of the
// creation flow, and the number badge of each question type in the review.
export const sequenceGradients = [
  { colors: [colors.brandBlue, colors.brandViolet], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  { colors: [colors.brandViolet, colors.brandMagenta], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  { colors: [colors.brandMagenta, colors.brandOrange], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
] as const satisfies readonly Gradient[];
