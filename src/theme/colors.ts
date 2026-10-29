// App-wide color tokens for Futur Génie (production v1 redesign — the
// approved spec is docs/design/README.md §3.1). Every screen takes its colors
// from here so the app reads as one product; no hex literals in screens.
//
// Semantic colors (success / danger / warning / info) carry meaning — correct
// answer, error, destructive action, AI warning — and are always paired with
// an icon or text, never used as the only signal (CLAUDE.md §37).
export const colors = {
  background: '#F5F6FD',
  text: '#141A46',
  textSecondary: '#555B80',
  textMuted: '#7A80A3',
  textBody: '#33395F',
  textOnBrand: '#FFFFFF',
  textOnBrandSoft: 'rgba(255,255,255,0.9)',

  brandBlue: '#3B4CF0',
  brandViolet: '#7B2FE0',
  brandMagenta: '#C0267F',
  brandRaspberry: '#D9286E',
  brandPurple: '#8B2FE0',
  brandOrange: '#FF8A4C',
  brandPeach: '#FFA05C',

  actionText: '#3140D6',
  link: '#B8205F',
  border: '#DCE0F2',
  borderStrong: '#B9BED6',
  borderDashed: '#9AA2D6',
  // Neutral tracks: empty progress segments, placeholder lines, idle rings.
  track: '#E3E6F3',
  trackSoft: '#ECEEF7',
  trackDashed: '#CDD1E6',
  surface: '#FFFFFF',
  // Bottom sheet (multi-quiz share) and the dimmed backdrop behind it.
  sheet: '#F7F8FE',
  backdrop: 'rgba(20,26,70,0.42)',
  surfaceSelected: 'rgba(255,255,255,0.92)',
  // Student page: picked answer before submission, explanation box.
  selectedSoft: '#F3ECFF',
  surfaceMuted: '#F3F4FB',

  surfaceGlass: 'rgba(255,255,255,0.72)',
  surfaceGlassSoft: 'rgba(255,255,255,0.65)',
  surfaceGlassBorder: 'rgba(255,255,255,0.95)',
  surfaceGlassStrong: 'rgba(255,255,255,0.8)',
  surfaceGlassFaint: 'rgba(255,255,255,0.5)',
  backgroundTransparent: 'rgba(245,246,253,0)',
  spinnerTrack: 'rgba(123,47,224,0.15)',
  // Surfaces that content scrolls *under* (floating tab bar). The mockups use
  // 72 % white + backdrop blur; without blur, text shows through sharply, so
  // these stay near-opaque instead.
  surfaceFloating: 'rgba(255,255,255,0.95)',
  // Translucent white layers drawn on top of a gradient (hero card).
  onBrandFill: 'rgba(255,255,255,0.16)',
  onBrandBorder: 'rgba(255,255,255,0.3)',
  onBrandBadge: 'rgba(255,255,255,0.2)',
  onBrandBadgeBorder: 'rgba(255,255,255,0.35)',
  onBrandAvatarBorder: 'rgba(255,255,255,0.4)',
  onBrandBubble: 'rgba(255,255,255,0.15)',
  onBrandWarmBubble: 'rgba(255,160,92,0.35)',
  // On the dark navy selection bar (Mes devoirs, select mode).
  textOnDarkMuted: '#C9CCE6',
  onDarkFill: 'rgba(255,255,255,0.1)',
  onDarkBorder: 'rgba(255,255,255,0.22)',
  dangerOnDark: '#FFB4AE',

  success: { background: '#E5F5EC', border: '#2E9E5B', text: '#1C6B40' },
  danger: { background: '#FDECEC', text: '#A3251F', solid: '#C2362F' },
  warning: { background: '#FFF4E5', backgroundSoft: '#FFF7EC', border: '#E3A15A', text: '#8A4413', textSoft: '#9A5A12', icon: '#B25E12' },
  info: { background: 'rgba(59,76,240,0.08)', text: '#2A3290' },

  // Badge / pill tints (background, text), assigned per subject.
  tint: {
    blue: { background: '#E3E7FF', text: '#3140D6' },
    pink: { background: '#FBE1EE', text: '#8E1648' },
    violet: { background: '#EFE4FF', text: '#5A21A8' },
    orange: { background: '#FFEBDD', text: '#8A4413' },
  },
} as const;
