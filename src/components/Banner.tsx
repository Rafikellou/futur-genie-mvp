import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, type } from '@/theme';

type Tone = 'info' | 'warning' | 'error' | 'success';

const TONES: Record<
  Tone,
  { background: string; text: string; icon: ComponentProps<typeof Ionicons>['name'] }
> = {
  info: { background: colors.info.background, text: colors.info.text, icon: 'information-circle-outline' },
  warning: { background: colors.warning.background, text: colors.warning.text, icon: 'warning-outline' },
  error: { background: colors.danger.background, text: colors.danger.text, icon: 'alert-circle-outline' },
  success: { background: colors.success.background, text: colors.success.text, icon: 'checkmark-circle-outline' },
};

type Props = {
  tone: Tone;
  // One message, or several shown as separate lines in the same banner.
  messages: string | string[];
};

// Inline message with an icon — the tone is never conveyed by color alone
// (CLAUDE.md §37). Errors are announced to screen readers as alerts.
export function Banner({ tone, messages }: Props) {
  const { background, text, icon } = TONES[tone];
  const lines = Array.isArray(messages) ? messages : [messages];
  return (
    <View
      style={[styles.banner, { backgroundColor: background }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
    >
      <Ionicons name={icon} size={18} color={text} style={styles.icon} />
      <View style={styles.lines}>
        {lines.map((line, index) => (
          <Text key={index} style={[styles.text, { color: text }]}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.input,
  },
  icon: {
    marginTop: 1,
  },
  lines: {
    flex: 1,
    gap: 4,
  },
  text: {
    ...type.label,
    fontFamily: type.body.fontFamily,
    lineHeight: 20,
  },
});
