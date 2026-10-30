import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radii, shadows, sizes, spacing, type } from '@/theme';
import { useKeyboardVisible } from './useKeyboardVisible';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, IconName> = {
  index: 'home-outline',
  'my-quizzes': 'document-text-outline',
  suggestions: 'bulb-outline',
  profile: 'person-outline',
};

function useBottomOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, sizes.tabBarMargin);
}

// Vertical space the floating bar covers at the bottom of a tab screen. Tab
// screens add it as bottom padding to their scrollable content (and offset
// any bottom-anchored bar by it) so nothing hides behind the tab bar.
export function useTabBarSpace() {
  return useBottomOffset() + sizes.tabBar + spacing.lg;
}

// Where a bar floating above the tab bar (e.g. the "Mes devoirs" selection
// bar) should sit: just clear of the fade, so it isn't partly covered.
export function useAboveTabBarOffset() {
  return useBottomOffset() + sizes.tabBar + FADE_ABOVE_BAR;
}

// Floating capsule tab bar (docs/design/README §3.7). The active tab is a
// gradient pill with icon + label; inactive tabs show only their icon, so
// each carries an accessibilityLabel and the selected state is exposed to
// screen readers, never conveyed by color alone.
export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const bottom = useBottomOffset();
  const isKeyboardVisible = useKeyboardVisible();

  if (isKeyboardVisible) return null;

  const fadeHeight = bottom + sizes.tabBar + FADE_ABOVE_BAR;

  return (
    <>
      {/* Content scrolling under the floating bar fades into the background
          over the few points above the bar, then is fully hidden beside and
          below the capsule. */}
      <LinearGradient
        {...gradients.footerFade}
        locations={[0, FADE_ABOVE_BAR / fadeHeight]}
        pointerEvents="none"
        style={[styles.fade, { height: fadeHeight }]}
      />
      <View style={[styles.bar, { bottom }]} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const icon = TAB_ICONS[route.name] ?? 'ellipse-outline';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              style={focused ? styles.activeTab : styles.tab}
            >
              {focused ? (
                <>
                  <LinearGradient {...gradients.selected} style={styles.activeFill} />
                  <Ionicons name={icon} size={20} color={colors.textOnBrand} />
                  <Text style={styles.activeLabel}>{label}</Text>
                </>
              ) : (
                <Ionicons name={icon} size={22} color={colors.textSecondary} />
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const TAB_HEIGHT = 46;
const FADE_ABOVE_BAR = 24;

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    position: 'absolute',
    left: sizes.tabBarMargin,
    right: sizes.tabBarMargin,
    height: sizes.tabBar,
    borderRadius: radii.tabBar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceFloating,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
    boxShadow: shadows.tabBar,
    // Match the centered content column of <Screen> on web (auto margins
    // center an absolutely positioned box between its left/right offsets).
    ...Platform.select({
      web: {
        maxWidth: sizes.webContentMaxWidth - 2 * sizes.tabBarMargin,
        marginHorizontal: 'auto',
      },
    }),
  },
  tab: {
    width: TAB_HEIGHT,
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: TAB_HEIGHT / 2,
  },
  activeLabel: {
    ...type.labelStrong,
    color: colors.textOnBrand,
  },
});
