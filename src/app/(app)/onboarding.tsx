import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { TeacherDetailsForm } from '@/features/auth/TeacherDetailsForm';
import { colors, shadows, spacing, type } from '@/theme';

// Mandatory one-time screen shown right after the first sign-in. No back
// button and no skip: (app)/_layout redirects here until every field is
// filled, and away from here once they are (CLAUDE.md §27 — teacher routes
// stay protected; this just adds a completeness gate on top of the session).
export default function OnboardingScreen() {
  const { profile, updateTeacherDetails } = useAuth();

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo size={56} showWordmark={false} />
          <View>
            <Text style={styles.title} accessibilityRole="header">
              Bienvenue sur{'\n'}Futur Génie
            </Text>
            <Text style={styles.subtitle}>
              Encore quelques informations et vous pourrez créer votre premier devoir.
            </Text>
          </View>

          <GlassCard style={styles.formCard}>
            <TeacherDetailsForm
              initial={{
                title: profile?.title ?? undefined,
                firstName: profile?.firstName ?? undefined,
                lastName: profile?.lastName ?? undefined,
                schoolName: profile?.schoolName ?? undefined,
                schoolPostalCode: profile?.schoolPostalCode ?? undefined,
                classGrade: profile?.classGrade ?? undefined,
              }}
              submitLabel="Commencer"
              onSubmit={updateTeacherDetails}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.xl,
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formCard: {
    padding: 22,
    borderRadius: 28,
    boxShadow: shadows.form,
  },
});
