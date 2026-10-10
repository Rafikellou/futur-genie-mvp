import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, sizes, type } from '@/theme';

type Props = {
  onPress: () => void;
};

// Pill "‹ Retour" at the top-left of pushed screens.
export function BackButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Retour"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={18} color={colors.actionText} />
      <Text style={styles.label}>Retour</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: sizes.touchTarget,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: radii.chip,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...type.bodyStrong,
    color: colors.actionText,
  },
});
