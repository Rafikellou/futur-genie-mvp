import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { Screen } from '@/components/Screen';
import { buildPublicQuizUrl } from '@/features/quiz-publishing/publicQuizUrl';
import { copyText, shareText } from '@/features/quiz-sharing/shareOrCopy';
import { COLORS } from '@/theme/colors';

// The teacher's view of a published quiz: confirmation that it is live, the
// public URL to give to students, and the share / copy actions (Milestones 7
// & 10). Shown right after publishing, and also when a teacher taps a
// published quiz in "Mes devoirs".
export default function QuizPublishedScreen() {
  const { title, slug, quizId } = useLocalSearchParams<{
    title?: string;
    slug?: string;
    quizId?: string;
  }>();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const canGoBack = router.canGoBack();

  if (!slug) {
    return (
      <Screen>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Devoir introuvable</Text>
          <Text style={styles.body}>
            Ce lien n&apos;est plus disponible. Retournez à l&apos;accueil et réessayez.
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/')} accessibilityRole="button">
            <Text style={styles.buttonText}>Retour à l&apos;accueil</Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  const url = buildPublicQuizUrl(slug);

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {canGoBack && (
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>
      )}
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

      <View style={styles.shareRow}>
        <Pressable
          style={styles.shareButton}
          onPress={() => shareText(url)}
          accessibilityRole="button"
        >
          <Text style={styles.shareButtonText}>Partager</Text>
        </Pressable>
        <Pressable
          style={styles.shareButton}
          onPress={async () => {
            const ok = await copyText(url);
            if (ok) {
              setCopyFeedback(true);
              setTimeout(() => setCopyFeedback(false), 2000);
            }
          }}
          accessibilityRole="button"
        >
          <Text style={styles.shareButtonText}>{copyFeedback ? 'Lien copié ✓' : 'Copier le lien'}</Text>
        </Pressable>
      </View>

      {quizId && (
        <Pressable
          style={styles.buttonSecondary}
          onPress={() =>
            router.push({ pathname: '/quiz-results', params: { quizId, title: title || '' } })
          }
          accessibilityRole="button"
        >
          <Text style={styles.buttonSecondaryText}>Voir les réponses des élèves</Text>
        </Pressable>
      )}

      <Pressable style={styles.button} onPress={() => router.replace('/')} accessibilityRole="button">
        <Text style={styles.buttonText}>Retour à l&apos;accueil</Text>
      </Pressable>
      </ScrollView>
    </Screen>
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
  back: {
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 12,
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
    color: COLORS.primary,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
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
  buttonSecondary: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
