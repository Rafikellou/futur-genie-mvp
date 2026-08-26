import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

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
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${accessibilityLabelPrefix} ${option.label}`}
          >
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
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
