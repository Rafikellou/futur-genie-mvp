import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, radii, shadows, spacing, type } from '@/theme';

const LOGO_SOURCE = require('../../../../assets/images/logo-source.png');

type Props = {
  steps: readonly string[];
  // Index of the step in progress; earlier ones show as done.
  currentStep: number;
};

// Full-screen state shown while the lesson is being turned into a devoir
// (docs/design Generation.dc.html). The steps advance on a timer, not real
// progress — no percentage is shown (CLAUDE.md §38).
export function GenerationProgress({ steps, currentStep }: Props) {
  return (
    <View style={styles.container}>
      <SpinningLogo />

      <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          Création du devoir
        </Text>
        <Text style={styles.subtitle}>Gardez l’application ouverte.</Text>
      </View>

      <GlassCard style={styles.steps}>
        <View accessibilityLiveRegion="polite" accessible accessibilityLabel={`${steps[currentStep]}…`}>
          {steps.map((label, index) => {
            const state = index < currentStep ? 'done' : index === currentStep ? 'current' : 'pending';
            return (
              <View key={label} style={styles.step}>
                {state === 'done' && (
                  <View style={[styles.stepIcon, styles.stepDone]}>
                    <Ionicons name="checkmark" size={16} color={colors.success.text} />
                  </View>
                )}
                {state === 'current' && (
                  <View style={[styles.stepIcon, styles.stepCurrent]}>
                    <ActivityIndicator size="small" color={colors.brandViolet} />
                  </View>
                )}
                {state === 'pending' && <View style={[styles.stepIcon, styles.stepPending]} />}
                <Text
                  style={[
                    styles.stepText,
                    state === 'current' && styles.stepTextCurrent,
                    state === 'pending' && styles.stepTextPending,
                  ]}
                >
                  {label}
                  {state === 'current' ? '…' : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </GlassCard>
    </View>
  );
}

// Logo inside a glass disc with a rotating gradient-tinted arc. The arc stays
// still when the system "reduce motion" setting is on.
function SpinningLogo() {
  const [rotation] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.logoWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.logoDisc} />
      <Animated.View style={[styles.arc, { transform: [{ rotate }] }]} />
      <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const LOGO_WRAP = 132;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 26,
  },
  logoWrap: {
    width: LOGO_WRAP,
    height: LOGO_WRAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDisc: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
    boxShadow: shadows.halo,
  },
  arc: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: radii.pill,
    borderWidth: 4,
    borderColor: colors.spinnerTrack,
    borderTopColor: colors.brandRaspberry,
    borderRightColor: colors.brandViolet,
  },
  logo: {
    width: 64,
    height: 64,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...type.heroTitle,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  steps: {
    alignSelf: 'stretch',
    padding: 18,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 7,
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    backgroundColor: colors.success.background,
  },
  stepCurrent: {
    backgroundColor: colors.surface,
  },
  stepPending: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.trackDashed,
  },
  stepText: {
    ...type.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  stepTextCurrent: {
    fontFamily: type.bodyStrong.fontFamily,
    color: colors.text,
  },
  // The mockup's lighter grey (textMuted) is below 4.5:1 on this surface;
  // the dashed ring already marks the step as not started.
  stepTextPending: {
    color: colors.textSecondary,
    opacity: 0.85,
  },
});
