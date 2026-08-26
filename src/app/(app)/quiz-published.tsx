import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { buildPublicQuizUrl } from '@/features/quiz-publishing/publicQuizUrl';

// Result screen of Milestone 7's publish action: the teacher's confirmation
// that the quiz is live, plus the public URL to give to students. Native
// share sheet and "copy link" are Milestone 9 — the URL is shown as
// selectable text in the meantime so it can still be copied manually.
export default function QuizPublishedScreen() {
  const { title, slug } = useLocalSearchParams<{ title?: string; slug?: string }>();

  if (!slug) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Devoir introuvable</Text>
        <Text style={styles.body}>
          Ce lien n&apos;est plus disponible. Retournez à l&apos;accueil et réessayez.
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace('/')} accessibilityRole="button">
          <Text style={styles.buttonText}>Retour à l&apos;accueil</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const url = buildPublicQuizUrl(slug);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.badge}>Devoir publié</Text>
      <Text style={styles.title}>{title || 'Le devoir'} est prêt</Text>
      <Text style={styles.body}>
        Donnez ce lien à vos élèves pour qu&apos;ils fassent le devoir, sans compte ni
        installation.
      </Text>

      <View style={styles.linkBox}>
        <Text style={styles.linkText} selectable accessibilityLabel="Lien du devoir à partager">
          {url}
        </Text>
      </View>

      <Pressable style={styles.button} onPress={() => router.replace('/')} accessibilityRole="button">
        <Text style={styles.buttonText}>Retour à l&apos;accueil</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 4,
    flexGrow: 1,
  },
  badge: {
    color: '#1F6E40',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 20,
  },
  linkBox: {
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#208AEF',
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
