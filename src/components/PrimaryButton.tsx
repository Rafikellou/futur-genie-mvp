import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, gradients, radii, shadows, sizes, type } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  // Shown after the label (e.g. "Continuer →") instead of before it.
  trailingIcon?: IconName;
  disabled?: boolean;
  // Replaces the content with a spinner and blocks presses.
  loading?: boolean;
  // 'large': taller, bigger label — the student page's main actions.
  size?: 'default' | 'large';
  style?: ViewStyle;
};

// The single most important action of a screen: raspberry → purple gradient.
export function PrimaryButton({
  label,
  onPress,
  icon,
  trailingIcon,
  disabled = false,
  loading = false,
  size = 'default',
  style,
}: Props) {
  const isLarge = size === 'large';
  const isInactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isLarge && styles.buttonLarge,
        !disabled && styles.shadow,
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
    >
      <LinearGradient
        {...gradients.primaryButton}
        style={[styles.fill, isLarge && styles.fillLarge]}
      />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.textOnBrand} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={22} color={colors.textOnBrand} />}
            <Text style={[styles.label, isLarge && styles.labelLarge]}>{label}</Text>
            {trailingIcon && (
              <Ionicons name={trailingIcon} size={isLarge ? 20 : 18} color={colors.textOnBrand} />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.primaryButton,
    borderRadius: radii.button,
    justifyContent: 'center',
  },
  buttonLarge: {
    minHeight: sizes.studentButton,
    borderRadius: radii.chip,
  },
  shadow: {
    boxShadow: shadows.primaryButton,
  },
  dimmed: {
    opacity: 0.6,
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.button,
  },
  fillLarge: {
    borderRadius: radii.chip,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  label: {
    ...type.button,
    color: colors.textOnBrand,
    textAlign: 'center',
  },
  labelLarge: {
    fontSize: 19,
  },
});
