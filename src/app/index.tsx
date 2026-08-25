import { StyleSheet, Text, View } from 'react-native';

// Placeholder home screen for Milestone 1 (foundations).
// Replaced by the real teacher home screen in Milestone 2 (authentication).
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Futur Génie</Text>
      <Text style={styles.subtitle}>L&apos;application démarre correctement.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
  },
});
