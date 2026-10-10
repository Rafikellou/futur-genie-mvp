import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, gradients, radii, shadows } from '@/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  // Overrides the inner card (padding, radius, layout) for smaller variants.
  contentStyle?: ViewStyle;
};

// Brand gradient card with two decorative bubbles (home, published quiz,
// profile header, student cards). The outer view carries the shadow, the
// inner one clips the bubbles to the rounded corners — combining both on one
// view would clip the shadow on some platforms.
export function HeroCard({ children, style, contentStyle }: Props) {
  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient {...gradients.hero} style={[styles.card, contentStyle]}>
        <View style={[styles.bubble, styles.bubbleTop]} />
        <View style={[styles.bubble, styles.bubbleBottom]} />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radii.hero,
    boxShadow: shadows.hero,
  },
  card: {
    borderRadius: radii.hero,
    padding: 24,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    borderRadius: radii.pill,
  },
  bubbleTop: {
    width: 190,
    height: 190,
    right: -60,
    top: -70,
    backgroundColor: colors.onBrandBubble,
  },
  bubbleBottom: {
    width: 130,
    height: 130,
    right: 30,
    bottom: -80,
    backgroundColor: colors.onBrandWarmBubble,
  },
});
