// Spacing, radii, sizes and shadows (docs/design/README §3.5).
export const spacing = {
  screen: 22,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  input: 16,
  field: 14,
  badge: 9,
  tile: 12,
  row: 18,
  button: 20,
  chip: 22,
  card: 24,
  hero: 30,
  tabBar: 28,
  pill: 999,
} as const;

export const sizes = {
  touchTarget: 44,
  input: 52,
  chip: 44,
  primaryButton: 58,
  studentButton: 62,
  compactButton: 48,
  secondaryButton: 56,
  listRow: 60,
  tabBar: 68,
  tabBarMargin: 16,
} as const;

// `boxShadow` strings — supported by React Native's New Architecture on iOS,
// Android and web, so one value renders the same everywhere.
export const shadows = {
  hero: '0px 18px 40px rgba(59,76,240,0.28)',
  primaryButton: '0px 12px 26px rgba(217,40,110,0.28)',
  glass: '0px 6px 18px rgba(20,26,70,0.08)',
  card: '0px 6px 18px rgba(20,26,70,0.06)',
  panel: '0px 16px 36px rgba(20,26,70,0.06)',
  photo: '0px 16px 36px rgba(20,26,70,0.1)',
  sheet: '0px 10px 24px rgba(20,26,70,0.1)',
  halo: '0px 18px 40px rgba(59,76,240,0.25)',
  form: '0px 16px 40px rgba(20,26,70,0.08)',
  brandTile: '0px 18px 40px rgba(59,76,240,0.3)',
  warmTile: '0px 10px 22px rgba(217,40,110,0.25)',
  warmHero: '0px 18px 40px rgba(217,40,110,0.3)',
  floatingBadge: '0px 6px 14px rgba(20,26,70,0.12)',
  focusRing: '0px 0px 0px 4px rgba(123,47,224,0.12)',
  studentCard: '0px 10px 28px rgba(20,26,70,0.07)',
  speechBubble: '0px 8px 22px rgba(20,26,70,0.08)',
  avatar: '0px 4px 14px rgba(20,26,70,0.08)',
  tabBar: '0px 12px 30px rgba(20,26,70,0.14)',
  selectionBar: '0px 16px 34px rgba(20,26,70,0.3)',
  bottomSheet: '0px -12px 40px rgba(20,26,70,0.2)',
} as const;
