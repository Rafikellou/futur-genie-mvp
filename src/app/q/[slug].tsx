import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Deliberately outside the (app)/(auth) route groups (see src/app/_layout.tsx):
// neither Stack.Protected guard covers this file, so it renders without a
// teacher session — this is the student-facing public route (CLAUDE.md §8).
import { supabase } from '@shared/supabase/client';
import { PublicQuizDataSchema, type PublicQuizData } from '@shared/domain/quiz';

type LoadState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error' }
  | { status: 'ready'; quiz: PublicQuizData };

// Read-only proof that publishing → the public view → an anonymous reader
// works end-to-end (Milestone 7). Answering, submission and correction are
// Milestone 8 — deliberately not built here (CLAUDE.md §60).
export default function PublicQuizScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { data, error } = await supabase
        .from('public_quizzes')
        .select('public_quiz_data')
        .eq('public_slug', slug)
        .maybeSingle();

      if (error) {
        setState({ status: 'error' });
        return;
      }
      if (!data) {
        setState({ status: 'not_found' });
        return;
      }

      const parsed = PublicQuizDataSchema.safeParse(data.public_quiz_data);
      if (!parsed.success) {
        setState({ status: 'error' });
        return;
      }

      setState({ status: 'ready', quiz: parsed.data });
    } catch {
      setState({ status: 'error' });
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.loadingText}>Chargement du devoir…</Text>
      </View>
    );
  }

  if (state.status === 'not_found') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Devoir introuvable</Text>
        <Text style={styles.body}>
          Ce lien n&apos;est plus valable. Demandez à votre enseignant·e de vous en renvoyer
          un.
        </Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Impossible d&apos;ouvrir ce devoir</Text>
        <Text style={styles.body}>Vérifiez votre connexion Internet puis réessayez.</Text>
        <Pressable style={styles.button} onPress={load} accessibilityRole="button">
          <Text style={styles.buttonText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  const { quiz } = state;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{quiz.title}</Text>
      <Text style={styles.instructions}>{quiz.instructions}</Text>

      <View style={styles.questionList}>
        {quiz.questions.map((question, index) => (
          <View key={question.id} style={styles.card}>
            <Text style={styles.cardLabel}>Question {index + 1}</Text>
            <Text style={styles.questionText}>{question.question}</Text>

            {question.type === 'multiple_choice' && (
              <View style={styles.choiceList}>
                {question.choices.map((choice, choiceIndex) => (
                  <Text key={choiceIndex} style={styles.choiceText}>
                    • {choice}
                  </Text>
                ))}
              </View>
            )}

            {question.type === 'true_false' && (
              <Text style={styles.choiceText}>Vrai ou faux ?</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.comingSoonBox}>
        <Text style={styles.comingSoonText}>
          Le remplissage et l&apos;envoi des réponses arrivent bientôt.
        </Text>
      </View>
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
  },
  centered: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#555555',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 20,
  },
  questionList: {
    gap: 14,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777777',
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  choiceList: {
    gap: 4,
  },
  choiceText: {
    fontSize: 15,
    color: '#333333',
  },
  comingSoonBox: {
    backgroundColor: '#EAF2FB',
    borderRadius: 10,
    padding: 14,
  },
  comingSoonText: {
    color: '#1A5FA0',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
