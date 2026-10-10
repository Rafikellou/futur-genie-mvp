import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radii, sizes, type } from '@/theme';

// Generic single-select chip row, reused for every choice in the create-
// exercise form (grade, subject, exercise type, number of questions).
// Kept generic rather than one component per choice: the four selectors
// differ only in their option list, not in behavior.
type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  options: Option<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  accessibilityLabelPrefix: string;
};

export function OptionChips<T extends string | number>({
  options,
  selected,
  onSelect,
  accessibilityLabelPrefix,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            style={[styles.chip, !isSelected && styles.chipIdle]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${accessibilityLabelPrefix} ${option.label}`}
          >
            {isSelected && <LinearGradient {...gradients.selected} style={styles.fill} />}
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: sizes.chip,
    paddingHorizontal: 18,
    borderRadius: radii.chip,
    justifyContent: 'center',
  },
  chipIdle: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.chip,
  },
  chipText: {
    ...type.label,
    fontSize: 15,
    color: colors.text,
  },
  chipTextSelected: {
    fontFamily: type.bodyStrong.fontFamily,
    color: colors.textOnBrand,
  },
});
