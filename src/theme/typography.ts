import type { TextStyle } from 'react-native';

// Each weight is its own font file, referenced by family name rather than
// `fontWeight`: Android does not synthesize weights for custom fonts, so a
// `fontWeight: '800'` on a regular family would silently render regular.
// The names below are the keys passed to `useFonts` in src/app/_layout.tsx.
export const fontFiles = {
  BricolageGrotesque_600SemiBold: require('@expo-google-fonts/bricolage-grotesque/600SemiBold/BricolageGrotesque_600SemiBold.ttf'),
  BricolageGrotesque_800ExtraBold: require('@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf'),
  DMSans_400Regular: require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
  DMSans_500Medium: require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
  DMSans_600SemiBold: require('@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf'),
};

export const fonts = {
  heading: 'BricolageGrotesque_800ExtraBold',
  headingSemiBold: 'BricolageGrotesque_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
} as const;

// Named text styles (docs/design/README §3.4). Colors are left to the caller.
export const type = {
  display: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 34, letterSpacing: -0.64 },
  title: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 31, letterSpacing: -0.56 },
  inputTitle: { fontFamily: fonts.heading, fontSize: 22 },
  wordmark: { fontFamily: fonts.heading, fontSize: 22, letterSpacing: -0.44 },
  stat: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 32 },
  sectionTitle: { fontFamily: fonts.headingSemiBold, fontSize: 18 },
  button: { fontFamily: fonts.bodySemiBold, fontSize: 17 },
  buttonSecondary: { fontFamily: fonts.bodySemiBold, fontSize: 16 },
  body: { fontFamily: fonts.body, fontSize: 16 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 15 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  labelStrong: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  bodyEmphasis: { fontFamily: fonts.bodySemiBold, fontSize: 16 },
  input: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  meta: { fontFamily: fonts.body, fontSize: 13 },
  metaStrong: { fontFamily: fonts.bodySemiBold, fontSize: 13 },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.72, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;
