import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Deliberately outside the (app)/(auth) route groups (see src/app/_layout.tsx):
// neither Stack.Protected guard covers this file, so it renders without a
// teacher session — this is the student-facing public route (CLAUDE.md §8).
import { supabase } from '@shared/supabase/client';
import { PublicQuizDataSchema, type PublicQuizData } from '@shared/domain/quiz';
import {
  areAllAnswered,
  createEmptyAnswers,
  gradeQuiz,
  type AnswerMap,
} from '@/features/quiz-taking/grading';
import { submitSubmission } from '@/features/quiz-taking/submitSubmission';
import { COLORS } from '@/theme/colors';

type LoadState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error' }
  | { status: 'ready'; quiz: PublicQuizData };

// Public quiz: an anonymous student loads it, answers, and gets an
// immediate correction (Milestone 8). No account — a first name is the only
// thing asked, purely so the teacher can tell students apart on the results
// screen (CLAUDE.md §32 exception). Correction itself is still entirely
// client-side against `public_quiz_data` (src/features/quiz-taking/grading.ts);
// the submission is separately recorded in the background for the teacher
// (Milestone 9, src/features/quiz-taking/submitSubmission.ts).
export default function PublicQuizScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [studentName, setStudentName] = useState('');
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  // Guards the background submission, not just the correction display: a
  // "Recommencer" (or a fast double-tap on "Valider") must never record a
  // second row for the same sitting — the teacher's results list should
  // show one line per student, not one per attempt (see PROGRESS.md,
  // Milestone 9 follow-up). A ref (not state) because it must never trigger
  // a re-render on its own and must survive across retries within this
  // component instance.
  const hasSubmittedRef = useRef(false);

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
      setAnswers(createEmptyAnswers(parsed.data.questions));
      setSubmitted(false);
      setStarted(false);
      hasSubmittedRef.current = false;
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
  const allAnswered = areAllAnswered(quiz.questions, answers);
  const summary = submitted ? gradeQuiz(quiz.questions, answers) : null;

  const setMultipleChoiceAnswer = (questionId: string, choice: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { type: 'multiple_choice', value: choice } }));
  };

  const setTrueFalseAnswer = (questionId: string, value: boolean) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { type: 'true_false', value } }));
  };

  const setShortAnswer = (questionId: string, text: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { type: 'short_answer', value: text } }));
  };

  const handleRetry = () => {
    setAnswers(createEmptyAnswers(quiz.questions));
    setSubmitted(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // "Recommencer" still recomputes and shows the correction locally every
    // time (unchanged) — only the background recording is limited to the
    // first attempt of this sitting.
    if (!hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      // Fire-and-forget: the student's own correction above is computed
      // locally and never depends on this call succeeding (see file header).
      submitSubmission(slug, studentName, answers);
    }
  };

  if (!started) {
    const trimmedName = studentName.trim();
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{quiz.title}</Text>
        <Text style={styles.instructions}>{quiz.instructions}</Text>

        <Text style={styles.nameLabel}>Ton prénom</Text>
        <TextInput
          value={studentName}
          onChangeText={setStudentName}
          placeholder="Ton prénom"
          placeholderTextColor="#999999"
          style={styles.nameInput}
          accessibilityLabel="Ton prénom"
        />

        <Pressable
          style={[styles.button, trimmedName.length === 0 && styles.buttonDisabled]}
          onPress={() => setStarted(true)}
          disabled={trimmedName.length === 0}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Commencer</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{quiz.title}</Text>
      <Text style={styles.instructions}>{quiz.instructions}</Text>

      {summary && (
        <View style={styles.scoreBox}>
          {summary.gradableCount > 0 ? (
            <Text style={styles.scoreText}>
              {summary.correctCount} / {summary.gradableCount} bonnes réponses
            </Text>
          ) : (
            <Text style={styles.scoreText}>Corrige tes réponses ci-dessous</Text>
          )}
        </View>
      )}

      <View style={styles.questionList}>
        {quiz.questions.map((question, index) => {
          const answer = answers[question.id];
          const result = summary?.results.find((r) => r.questionId === question.id) ?? null;

          return (
            <View key={question.id} style={styles.card}>
              <Text style={styles.cardLabel}>Question {index + 1}</Text>
              <Text style={styles.questionText}>{question.question}</Text>

              {question.type === 'multiple_choice' && (
                <View style={styles.choiceList}>
                  {question.choices.map((choice, choiceIndex) => {
                    const isSelected =
                      answer?.type === 'multiple_choice' && answer.value === choice;
                    const isCorrectChoice = submitted && choice === question.correctAnswer;
                    const isWrongSelected = submitted && isSelected && !isCorrectChoice;

                    return (
                      <Pressable
                        key={choiceIndex}
                        onPress={() => setMultipleChoiceAnswer(question.id, choice)}
                        disabled={submitted}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected, disabled: submitted }}
                        style={[
                          styles.choiceOption,
                          isSelected && styles.choiceOptionSelected,
                          isCorrectChoice && styles.choiceOptionCorrect,
                          isWrongSelected && styles.choiceOptionWrong,
                        ]}
                      >
                        <Text style={styles.choiceText}>
                          {submitted && isCorrectChoice ? '✅ ' : ''}
                          {isWrongSelected ? '❌ ' : ''}
                          {choice}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {question.type === 'true_false' && (
                <View style={styles.trueFalseRow}>
                  {([true, false] as const).map((value) => {
                    const label = value ? 'Vrai' : 'Faux';
                    const isSelected = answer?.type === 'true_false' && answer.value === value;
                    const isCorrectChoice = submitted && value === question.correctAnswer;
                    const isWrongSelected = submitted && isSelected && !isCorrectChoice;

                    return (
                      <Pressable
                        key={label}
                        onPress={() => setTrueFalseAnswer(question.id, value)}
                        disabled={submitted}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected, disabled: submitted }}
                        style={[
                          styles.trueFalseOption,
                          isSelected && styles.choiceOptionSelected,
                          isCorrectChoice && styles.choiceOptionCorrect,
                          isWrongSelected && styles.choiceOptionWrong,
                        ]}
                      >
                        <Text style={styles.choiceText}>
                          {submitted && isCorrectChoice ? '✅ ' : ''}
                          {isWrongSelected ? '❌ ' : ''}
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {question.type === 'short_answer' && (
                <TextInput
                  value={answer?.type === 'short_answer' ? answer.value : ''}
                  onChangeText={(text) => setShortAnswer(question.id, text)}
                  editable={!submitted}
                  placeholder="Ta réponse"
                  placeholderTextColor="#999999"
                  style={[styles.shortAnswerInput, submitted && styles.shortAnswerInputDisabled]}
                  accessibilityLabel={`Ta réponse à la question ${index + 1}`}
                />
              )}

              {submitted && question.type === 'short_answer' && (
                <View style={styles.correctionBox}>
                  <Text style={styles.correctionLabel}>Réponse attendue</Text>
                  <Text style={styles.correctionText}>{question.correctAnswer}</Text>
                  <Text style={styles.correctionHint}>
                    Compare ta réponse à la réponse attendue.
                  </Text>
                </View>
              )}

              {submitted && result && result.isCorrect !== null && (
                <Text style={result.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}>
                  {result.isCorrect ? 'Bonne réponse !' : 'Ce n’est pas ça.'}
                </Text>
              )}

              {submitted && question.explanation && (
                <Text style={styles.explanationText}>{question.explanation}</Text>
              )}
            </View>
          );
        })}
      </View>

      {!submitted && quiz.questions.length > 0 && (
        <Pressable
          style={[styles.button, !allAnswered && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!allAnswered}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Valider mes réponses</Text>
        </Pressable>
      )}

      {submitted && (
        <Pressable style={styles.buttonSecondary} onPress={handleRetry} accessibilityRole="button">
          <Text style={styles.buttonSecondaryText}>Recommencer</Text>
        </Pressable>
      )}
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
  nameLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  nameInput: {
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  scoreBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreText: {
    color: COLORS.primaryPressed,
    fontSize: 17,
    fontWeight: '700',
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
    gap: 8,
  },
  choiceOption: {
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  choiceOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  choiceOptionCorrect: {
    borderColor: '#2E9E5B',
    backgroundColor: '#E7F6EC',
  },
  choiceOptionWrong: {
    borderColor: '#D9463F',
    backgroundColor: '#FBEAEA',
  },
  choiceText: {
    fontSize: 15,
    color: '#333333',
  },
  trueFalseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  trueFalseOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  shortAnswerInput: {
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  shortAnswerInputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#777777',
  },
  correctionBox: {
    backgroundColor: '#FFF7E6',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  correctionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A6B00',
    textTransform: 'uppercase',
  },
  correctionText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  correctionHint: {
    fontSize: 13,
    color: '#6B5300',
  },
  feedbackCorrect: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E9E5B',
  },
  feedbackWrong: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D9463F',
  },
  explanationText: {
    fontSize: 14,
    color: '#555555',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.primaryMuted,
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
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
