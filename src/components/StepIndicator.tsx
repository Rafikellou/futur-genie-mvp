import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, sequenceGradients, spacing, type } from '@/theme';

const TOTAL_STEPS = sequenceGradients.length;

// "Étape x sur 3" — sits on the right of the back button row.
export function StepLabel({ step, suffix }: { step: number; suffix?: string }) {
  return (
    <Text style={styles.label}>
      Étape {step} sur {TOTAL_STEPS}
      {suffix ? ` · ${suffix}` : ''}
    </Text>
  );
}

// 3-segment progress bar; completed and current segments are filled. Purely
// visual — the step label carries the same information for screen readers.
export function StepBar({ step }: { step: number }) {
  return (
    <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {sequenceGradients.map((gradient, index) =>
        index < step ? (
          <LinearGradient
            key={index}
            {...gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.segment}
          />
        ) : (
          <View key={index} style={[styles.segment, styles.segmentEmpty]} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...type.metaStrong,
    color: colors.textSecondary,
  },
  bar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: -spacing.xs,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  segmentEmpty: {
    backgroundColor: colors.border,
  },
});
