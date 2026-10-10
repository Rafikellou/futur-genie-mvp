import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, radii, shadows, sizes, type } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  // Replaces the content with a spinner and blocks presses.
  loading?: boolean;
  // Overrides the visible label for screen readers when it's abbreviated.
  accessibilityLabel?: string;
  style?: ViewStyle;
};

// "Glass" secondary action: translucent white with blue text.
export function SecondaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}: Props) {
  const isInactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dimmed, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.actionText} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={colors.actionText} />}
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.secondaryButton,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.surfaceGlassSoft,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
    boxShadow: shadows.glass,
  },
  dimmed: {
    opacity: 0.6,
  },
  label: {
    ...type.buttonSecondary,
    color: colors.actionText,
    textAlign: 'center',
  },
});
