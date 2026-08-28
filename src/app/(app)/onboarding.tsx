import { ScrollView, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/features/auth/AuthProvider';
import { TeacherDetailsForm } from '@/features/auth/TeacherDetailsForm';

// Mandatory one-time screen shown right after the first sign-in. No back
// button and no skip: (app)/_layout redirects here until every field is
// filled, and away from here once they are (CLAUDE.md §27 — teacher routes
// stay protected; this just adds a completeness gate on top of the session).
export default function OnboardingScreen() {
  const { profile, updateTeacherDetails } = useAuth();

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size={40} style={styles.logo} />
        <Text style={styles.title}>Bienvenue sur Futur Génie</Text>
        <Text style={styles.subtitle}>
          Encore quelques informations et vous pourrez créer votre premier devoir.
        </Text>

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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555555',
    marginBottom: 24,
  },
});
