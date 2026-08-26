import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

export default function HomeScreen() {
  const { profile } = useAuth();
  const greetingName = profile?.displayName?.trim() || 'enseignant·e';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bonjour {greetingName}</Text>
        <Link href="/profile" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Mon profil">
            <Text style={styles.profileLink}>Profil</Text>
          </Pressable>
        </Link>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flexShrink: 1,
  },
  profileLink: {
    color: '#208AEF',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#208AEF',
    fontSize: 16,
    fontWeight: '600',
  },
});
