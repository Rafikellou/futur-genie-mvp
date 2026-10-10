import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, type } from '@/theme';

export type PillTone = 'blue' | 'pink' | 'violet' | 'orange';

const TONES: Record<PillTone, { background: string; text: string }> = {
  blue: { background: colors.tint.blue.background, text: colors.info.text },
  pink: colors.tint.pink,
  violet: colors.tint.violet,
  orange: colors.tint.orange,
};

type Props = {
  label: string;
  tone: PillTone;
  size?: 'md' | 'sm';
};

// Small tinted tag: grade, subject, exercise type, question count.
export function Pill({ label, tone, size = 'md' }: Props) {
  const { background, text } = TONES[tone];
  return (
    <View style={[styles.pill, size === 'sm' && styles.pillSmall, { backgroundColor: background }]}>
      <Text style={[styles.label, size === 'sm' && styles.labelSmall, { color: text }]}>{label}</Text>
    </View>
  );
}

// The 4 recap pills of the creation flow, always in the same order and colors.
export function QuizRecapPills({
  labels,
  size,
}: {
  labels: [grade: string, subject: string, quizType: string, count: string];
  size?: 'md' | 'sm';
}) {
  const tones: PillTone[] = ['blue', 'pink', 'violet', 'orange'];
  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <Pill key={index} label={label} tone={tones[index]} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  pillSmall: {
    height: 26,
    paddingHorizontal: 10,
  },
  label: {
    ...type.metaStrong,
  },
  labelSmall: {
    fontSize: 12,
  },
});
