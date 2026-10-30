import type { ReactNode } from 'react';
import { Image, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, sizes } from '@/theme';

// Soft colored "halos" behind every screen (docs/design/README §3.3). A single
// pre-rendered image (~55 KB) rather than blurred views: runtime blur would
// need a native dependency and costs GPU on every screen, for a background
// that never changes. Regenerate it offline if the halo colors change.
const HALOS = require('../../assets/images/halos.png');

type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
};

// Every screen that places a Pressable at its very top (almost always the
// "‹ Retour" back button) wraps its content in this instead of a bare View,
// so that button lands below the iOS status bar / Dynamic Island instead of
// partially underneath it. With `headerShown: false` everywhere (custom
// screens, not the native Stack header), nothing else applies this inset.
// `edges={['top']}` only: left/right/bottom padding stays each screen's own
// concern (`styles.container`), unaffected by this wrapper.
export function Screen({ children, style }: ScreenProps) {
  return (
    <View style={styles.root}>
      <Image
        source={HALOS}
        style={styles.halos}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <SafeAreaView edges={['top']} style={[styles.default, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Explicit 100 % size: with only absolute edges, iOS kept the image at its
  // intrinsic (small) size in the top-left corner instead of stretching it.
  halos: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  default: {
    flex: 1,
    backgroundColor: 'transparent',
    // The halos stay full-bleed; only the content column is capped.
    ...Platform.select({
      web: { width: '100%', maxWidth: sizes.webContentMaxWidth, alignSelf: 'center' },
    }),
  },
});
