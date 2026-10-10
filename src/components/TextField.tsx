import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radii, shadows, sizes, type } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  // Label above the field; also used as its accessibilityLabel.
  label?: string;
  // 'form' (default): 14 px semibold, as in the account forms. 'caps': small
  // uppercase label, as in the quiz review screen.
  labelVariant?: 'form' | 'caps';
  // Message shown under the field with a red border — never color alone.
  error?: string | null;
  inputStyle?: TextStyle;
  style?: ViewStyle;
};

// White input with the app's border, radius and font. Multiline fields grow
// with their content from the given minimum height. Focused: violet border
// with a soft ring (docs/design Bienvenue.dc.html).
export function TextField({
  label,
  labelVariant = 'form',
  error,
  inputStyle,
  style,
  multiline,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={labelVariant === 'caps' ? styles.labelCaps : styles.label}>{label}</Text>
      )}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...inputProps}
        style={[
          styles.input,
          multiline && styles.multiline,
          isFocused && styles.focused,
          error ? styles.invalid : null,
          inputStyle,
        ]}
      />
      {error ? (
        <View style={styles.errorRow} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger.text} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    ...type.labelStrong,
    color: colors.text,
  },
  labelCaps: {
    ...type.fieldLabel,
    color: colors.textSecondary,
  },
  input: {
    ...type.body,
    minHeight: sizes.input,
    paddingHorizontal: 16,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  multiline: {
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 22,
  },
  focused: {
    borderWidth: 1.5,
    borderColor: colors.brandViolet,
    boxShadow: shadows.focusRing,
  },
  invalid: {
    borderWidth: 1.5,
    borderColor: colors.danger.solid,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    ...type.meta,
    flex: 1,
    color: colors.danger.text,
  },
});
