import type { ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView edges={['top']} style={[styles.default, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  default: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
