import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, type } from '@/theme';

// The Futur Génie brand mark: the flame-bulb icon, with the wordmark beside
// it by default. Used at the top of the home screen and the public student
// screen so both surfaces carry the identity.
const LOGO_SOURCE = require('../../assets/images/logo-source.png');

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  textColor?: string;
  style?: ViewStyle;
};

export function Logo({ size = 40, showWordmark = true, textColor = colors.text, style }: LogoProps) {
  // 22 px wordmark beside a 40 px mark in the mockups; scaled for other sizes.
  const fontSize = Math.round(size * 0.55);
  return (
    <View style={[styles.row, style]}>
      <Image
        source={LOGO_SOURCE}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Futur Génie"
      />
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            { fontSize, letterSpacing: fontSize * -0.02, color: textColor },
          ]}
        >
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
    gap: 8,
  },
  wordmark: {
    fontFamily: type.wordmark.fontFamily,
  },
});
