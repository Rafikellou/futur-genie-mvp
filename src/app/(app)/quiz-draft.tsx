import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GRADES } from '@shared/domain/grade';
import { SUBJECTS } from '@shared/domain/subject';
import { EXERCISE_TYPES } from '@shared/domain/exercise';
import { QuizDataSchema, type Question, type QuizData } from '@shared/domain/quiz';

// Read-only preview of the AI-generated draft (Milestone 5). Editing
// (Milestone 6) and publishing (Milestone 7) are not built yet — this
// screen only lets the teacher see what was generated, matching the
// "no UI ahead of its milestone" approach already used in create-photo.tsx.
export default function QuizDraftScreen() {
  const { quiz: quizParam } = useLocalSearchParams<{ quiz: string }>();
  const quiz = parseQuiz(quizParam);

  if (!quiz) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.title}>Devoir introuvable</Text>
        <Text style={styles.body}>
          Ce brouillon n&apos;est plus disponible. Revenez en arrière et recommencez.
        </Text>
      </ScrollView>
    );
  }

  const gradeLabel = GRADES.find((g) => g.value === quiz.grade)?.label ?? quiz.grade;
  const subjectLabel = SUBJECTS.find((s) => s.value === quiz.subject)?.label ?? quiz.subject;
  const quizTypeLabel = EXERCISE_TYPES.find((t) => t.value === quiz.quizType)?.label ?? quiz.quizType;

  function handleContinue() {
    // Editing and publishing land in the next milestones. Kept as an
    // explicit acknowledgment rather than a dead/disabled button so the
    // flow stays understandable (same approach as create-photo.tsx).
    Alert.alert(
      'Devoir créé',
      "La revue, la modification et la publication arrivent au prochain jalon."
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.back}>‹ Retour</Text>
      </Pressable>

      <Text style={styles.title}>{quiz.title}</Text>
      <Text style={styles.subtitle}>
        {gradeLabel} · {subjectLabel} · {quizTypeLabel} · {quiz.questions.length} question
        {quiz.questions.length > 1 ? 's' : ''}
      </Text>

      {quiz.instructions ? <Text style={styles.instructions}>{quiz.instructions}</Text> : null}

      {quiz.warnings.length > 0 && (
        <View style={styles.warningBox}>
          {quiz.warnings.map((warning, index) => (
            <Text key={index} style={styles.warningText}>
              {warning}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.questionList}>
        {quiz.questions.map((question, index) => (
          <QuestionCard key={question.id} index={index} question={question} />
        ))}
      </View>

      <Pressable style={styles.button} onPress={handleContinue} accessibilityRole="button">
        <Text style={styles.buttonText}>Continuer</Text>
      </Pressable>
    </ScrollView>
  );
}

function parseQuiz(raw: string | undefined): QuizData | null {
  if (!raw) return null;
  try {
    const result = QuizDataSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

type QuestionCardProps = {
  index: number;
  question: Question;
};

function QuestionCard({ index, question }: QuestionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Question {index + 1}</Text>
      <Text style={styles.cardQuestion}>{question.question}</Text>

      {question.type === 'multiple_choice' && (
        <View style={styles.choiceList}>
          {question.choices.map((choice) => {
            const isCorrect = choice === question.correctAnswer;
            return (
              <View key={choice} style={[styles.choice, isCorrect && styles.choiceCorrect]}>
                <Text style={[styles.choiceText, isCorrect && styles.choiceTextCorrect]}>
                  {isCorrect ? '✓ ' : ''}
                  {choice}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {question.type === 'true_false' && (
        <View style={styles.choiceList}>
          {[true, false].map((value) => {
            const isCorrect = value === question.correctAnswer;
            return (
              <View
                key={String(value)}
                style={[styles.choice, isCorrect && styles.choiceCorrect]}
              >
                <Text style={[styles.choiceText, isCorrect && styles.choiceTextCorrect]}>
                  {isCorrect ? '✓ ' : ''}
                  {value ? 'Vrai' : 'Faux'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {question.type === 'short_answer' && (
        <Text style={styles.expectedAnswer}>Réponse attendue : {question.correctAnswer}</Text>
      )}
    </View>
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
  back: {
    color: '#208AEF',
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#333333',
  },
  instructions: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#FFF6DF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 4,
  },
  warningText: {
    color: '#7A5B00',
    fontSize: 14,
  },
  questionList: {
    gap: 14,
    marginBottom: 24,
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
  cardQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  choiceList: {
    gap: 8,
  },
  choice: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  choiceCorrect: {
    borderColor: '#2E9E5B',
    backgroundColor: '#EAF7EF',
  },
  choiceText: {
    fontSize: 15,
    color: '#333333',
  },
  choiceTextCorrect: {
    color: '#1F6E40',
    fontWeight: '600',
  },
  expectedAnswer: {
    fontSize: 15,
    color: '#1F6E40',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
