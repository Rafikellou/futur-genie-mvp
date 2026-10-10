import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, gradients, radii, spacing, type } from '@/theme';

type Props = {
  // 'loading' shows a spinner instead of an icon.
  variant: 'loading' | 'info' | 'problem';
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void; primary?: boolean };
};

// The one centered layout for every loading / empty / error state
// (docs/design Etats.dc.html): illustration, short sentence, and an action
// when there is one. 'info' uses the brand tint (nothing is wrong, e.g. an
// empty list); 'problem' the warm warning tint (not found, network error).
export function EmptyState({ variant, icon, title, body, action }: Props) {
  return (
    <View style={styles.card} accessibilityRole={variant === 'problem' ? 'alert' : undefined}>
      {variant === 'loading' ? (
        <ActivityIndicator size="large" color={colors.brandViolet} style={styles.spinner} />
      ) : icon ? (
        variant === 'info' ? (
          <LinearGradient {...gradients.iconTile} style={styles.iconTile}>
            <Ionicons name={icon} size={30} color={colors.actionText} />
          </LinearGradient>
        ) : (
          <View style={[styles.iconTile, styles.iconTileProblem]}>
            <Ionicons name={icon} size={30} color={colors.warning.icon} />
          </View>
        )
      ) : null}

      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}

      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            !action.primary && styles.actionSecondary,
            pressed && styles.pressed,
          ]}
        >
          {action.primary && <LinearGradient {...gradients.primaryButton} style={styles.actionFill} />}
          <Text style={[styles.actionText, action.primary && styles.actionTextPrimary]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: 300,
    padding: spacing.xxl,
    borderRadius: 28,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
  },
  spinner: {
    height: 56,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileProblem: {
    backgroundColor: colors.warning.background,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...type.label,
    fontFamily: fonts.body,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  action: {
    marginTop: spacing.xs,
    minHeight: 46,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.input,
    justifyContent: 'center',
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.input,
  },
  actionText: {
    ...type.labelStrong,
    fontSize: 15,
    color: colors.actionText,
  },
  actionTextPrimary: {
    color: colors.textOnBrand,
  },
});
