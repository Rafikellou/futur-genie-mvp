import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, sizes, spacing } from '@/theme';
import { useKeyboardVisible } from './useKeyboardVisible';

const TOP_PADDING = 18;

function useBottomPadding() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, spacing.lg) + spacing.sm;
}

// Space a scrollable screen adds under its content so the last item can
// scroll clear of the sticky footer.
export function useStickyFooterSpace() {
  return useBottomPadding() + TOP_PADDING + sizes.primaryButton + spacing.xxl;
}

// Main action pinned to the bottom of a long screen ("Continuer", "Publier
// le devoir"), over a fade into the background color so content scrolling
// underneath dissolves instead of being cut. Hidden while the keyboard is up.
export function StickyFooter({ children }: { children: ReactNode }) {
  const paddingBottom = useBottomPadding();
  const isKeyboardVisible = useKeyboardVisible();
  if (isKeyboardVisible) return null;

  return (
    <View style={[styles.footer, { paddingBottom }]}>
      <LinearGradient {...gradients.footerFade} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: TOP_PADDING,
    paddingHorizontal: spacing.screen,
  },
});
