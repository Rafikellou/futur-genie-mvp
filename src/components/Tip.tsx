import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, fonts, gradients, shadows, sizes, type } from '@/theme';

export type TipId = 'quiz-review' | 'quiz-published' | 'my-quizzes';

const storageKey = (id: TipId) => `tip-seen:${id}`;

type Props = {
  id: TipId;
  text: string;
  style?: ViewStyle;
};

// First-visit hint (« Astuce », docs/design Astuces.dc.html), in the page flow
// rather than over it. Shown until the teacher closes it, then never again on
// this device: the "seen" flag lives in local storage only (owner decision,
// docs/design README §7.2) — a new phone shows the tips once more.
//
// Hidden until storage answers, so a tip already closed never flashes. If
// storage is unavailable, the tip simply shows and closing it lasts for the
// session.
export function Tip({ id, text, style }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey(id))
      .then((seen) => {
        if (!cancelled && seen == null) setVisible(true);
      })
      .catch(() => {
        if (!cancelled) setVisible(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    AsyncStorage.setItem(storageKey(id), '1').catch(() => {});
  }

  return (
    <View style={[styles.card, style]} accessibilityRole="summary">
      <LinearGradient {...gradients.warm} style={styles.icon}>
        <Ionicons name="bulb-outline" size={18} color={colors.textOnBrand} />
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.label}>Astuce</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Fermer l’astuce"
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.tipBorder,
    boxShadow: shadows.tip,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
    paddingTop: 1,
  },
  label: {
    ...type.fieldLabel,
    color: colors.tipLabel,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  close: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
