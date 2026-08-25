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

      <Text style={styles.subtitle}>
        Vous êtes connecté·e. La création de devoir arrive au prochain jalon.
      </Text>
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
  subtitle: {
    fontSize: 16,
    color: '#555555',
  },
});
