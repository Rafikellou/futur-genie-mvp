import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

// The Futur Génie brand mark (visual identity pass): the flame-bulb icon,
// with the wordmark beside it by default. Used at the top of the home screen
// and the public student screen so both surfaces carry the identity.
const LOGO_SOURCE = require('../../assets/images/logo-source.png');

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  // Defaults to near-black for the app's usual white backgrounds. The home
  // screen's purple gradient header passes '#FFFFFF' instead so the
  // wordmark stays legible over a dark, colored background.
  textColor?: string;
  style?: ViewStyle;
};

export function Logo({ size = 40, showWordmark = true, textColor = '#1A1A1A', style }: LogoProps) {
  return (
    <View style={[styles.row, style]}>
      <Image
        source={LOGO_SOURCE}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Futur Génie"
      />
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: Math.round(size * 0.52), color: textColor }]}>
          Futur Génie
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
