import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/features/auth/AuthProvider';
import { COLORS } from '@/theme/colors';

export default function HomeScreen() {
  const { profile } = useAuth();
  const greetingName = profile?.displayName?.trim() || 'enseignant·e';

  return (
    <Screen style={styles.container}>
      <Logo size={44} style={styles.logo} />

      <View style={styles.header}>
        <Text style={styles.title}>Bonjour {greetingName}</Text>
        <Link href="/profile" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Mon profil">
            <Text style={styles.profileLink}>Profil</Text>
          </Pressable>
        </Link>
      </View>

      {/* Actions sit in the middle of the screen rather than stacked at the
          top, so the home screen doesn't leave the lower half empty. */}
      <View style={styles.actions}>
        <Link href="/create" asChild>
          <Pressable style={styles.createButton} accessibilityRole="button">
            <Text style={styles.createButtonText}>Créer un devoir</Text>
          </Pressable>
        </Link>

        <Link href="/my-quizzes" asChild>
          <Pressable style={styles.secondaryButton} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Mes devoirs</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  logo: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flexShrink: 1,
  },
  profileLink: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
