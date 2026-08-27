import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

// The Futur Génie brand mark (visual identity pass): the flame-bulb icon,
// with the wordmark beside it by default. Used at the top of the home screen
// and the public student screen so both surfaces carry the identity.
const LOGO_SOURCE = require('../../assets/images/logo-source.png');

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  style?: ViewStyle;
};

export function Logo({ size = 40, showWordmark = true, style }: LogoProps) {
  return (
    <View style={[styles.row, style]}>
      <Image
        source={LOGO_SOURCE}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Futur Génie"
      />
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: Math.round(size * 0.52) }]}>Futur Génie</Text>
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
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
});
