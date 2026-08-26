import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { supabase } from '@shared/supabase/client';
import { GRADES } from '@shared/domain/grade';
import { SUBJECTS } from '@shared/domain/subject';
import { EXERCISE_TYPES } from '@shared/domain/exercise';
import { QuizDataSchema, type Question, type QuizData } from '@shared/domain/quiz';
import { COLORS } from '@/theme/colors';

// Editable preview of the AI-generated draft (Milestone 6), now wired to
// publishing (Milestone 7). The teacher stays in control of the final
// content (CLAUDE.md §6): title, instructions, question text, answers and
// multiple-choice options can all be edited, and questions can be removed.
// The edited quiz lives only in this screen's state until "Publier" is
// pressed — there is no separate "save draft" step (see PROGRESS.md,
// Milestone 6 decision).
export default function QuizDraftScreen() {
  const { quiz: quizParam } = useLocalSearchParams<{ quiz: string }>();
  const [quiz, setQuiz] = useState<QuizData | null>(() => parseQuiz(quizParam));
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  if (!quiz) {
    return (
      <Screen>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.back}>‹ Retour</Text>
          </Pressable>
          <Text style={styles.title}>Devoir introuvable</Text>
          <Text style={styles.body}>
            Ce brouillon n&apos;est plus disponible. Revenez en arrière et recommencez.
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  // Narrowed once, explicitly typed: TypeScript can't otherwise carry the
  // `quiz !== null` guard above into the closures declared below (they
  // close over the mutable `quiz` binding, not the narrowed value at this
  // point in the render).
  const currentQuiz: QuizData = quiz;

  const gradeLabel = GRADES.find((g) => g.value === currentQuiz.grade)?.label ?? currentQuiz.grade;
  const subjectLabel = SUBJECTS.find((s) => s.value === currentQuiz.subject)?.label ?? currentQuiz.subject;
  const quizTypeLabel =
    EXERCISE_TYPES.find((t) => t.value === currentQuiz.quizType)?.label ?? currentQuiz.quizType;

  function updateQuestion(questionId: string, updater: (question: Question) => Question) {
    setQuiz((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) => (q.id === questionId ? updater(q) : q)),
          }
        : prev
    );
  }

  function handleDeleteQuestion(questionId: string) {
    Alert.alert('Supprimer cette question ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          setQuiz((prev) =>
            prev ? { ...prev, questions: prev.questions.filter((q) => q.id !== questionId) } : prev
          ),
      },
    ]);
  }

  async function handlePublish() {
    const issues = findQuizIssues(currentQuiz);
    if (issues.length > 0) {
      Alert.alert('Devoir incomplet', issues[0]);
      return;
    }
    if (!QuizDataSchema.safeParse(currentQuiz).success) {
      Alert.alert('Devoir incomplet', 'Vérifiez les questions et les réponses avant de continuer.');
      return;
    }
    if (isPublishing) return;

    setPublishError(null);
    setIsPublishing(true);
    try {
      // Draft persistence and publishing happen as one action (no separate
      // "save draft" step exists in this app yet — see the file header).
      // `teacher_id` is left for the database default (`auth.uid()`); RLS
      // would reject any other value regardless (CLAUDE.md §48).
      const { data: inserted, error: insertError } = await supabase
        .from('quizzes')
        .insert({
          title: currentQuiz.title,
          grade: currentQuiz.grade,
          subject: currentQuiz.subject,
          quiz_type: currentQuiz.quizType,
          quiz_data: currentQuiz,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        setPublishError(PUBLISH_ERROR_MESSAGE);
        return;
      }

      // Returns the row directly (not an array): the RPC function returns a
      // single `quizzes` row, not a set.
      const { data: published, error: rpcError } = await supabase.rpc('publish_quiz', {
        p_quiz_id: inserted.id,
      });

      if (rpcError || !published?.public_slug) {
        setPublishError(PUBLISH_ERROR_MESSAGE);
        return;
      }

      router.replace({
        pathname: '/quiz-published',
        params: { title: currentQuiz.title, slug: published.public_slug, quizId: published.id },
      });
    } catch {
      setPublishError(PUBLISH_ERROR_MESSAGE);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>

        <TextInput
          style={styles.titleInput}
          value={currentQuiz.title}
          onChangeText={(text) => setQuiz((prev) => (prev ? { ...prev, title: text } : prev))}
          placeholder="Titre du devoir"
          accessibilityLabel="Titre du devoir"
        />
        <Text style={styles.subtitle}>
          {gradeLabel} · {subjectLabel} · {quizTypeLabel} · {currentQuiz.questions.length} question
          {currentQuiz.questions.length > 1 ? 's' : ''}
        </Text>

        <TextInput
          style={styles.instructionsInput}
          value={currentQuiz.instructions}
          onChangeText={(text) => setQuiz((prev) => (prev ? { ...prev, instructions: text } : prev))}
          placeholder="Consigne pour l'élève"
          accessibilityLabel="Consigne du devoir"
          multiline
        />

        {currentQuiz.warnings.length > 0 && (
          <View style={styles.warningBox}>
            {currentQuiz.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>
                {warning}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.questionList}>
          {currentQuiz.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              index={index}
              question={question}
              onChangeQuestionText={(text) =>
                updateQuestion(question.id, (q) => ({ ...q, question: text }))
              }
              onChangeChoiceText={(choiceIndex, text) =>
                updateQuestion(question.id, (q) => {
                  if (q.type !== 'multiple_choice') return q;
                  const oldChoice = q.choices[choiceIndex];
                  const choices = q.choices.map((c, i) => (i === choiceIndex ? text : c));
                  const correctAnswer = q.correctAnswer === oldChoice ? text : q.correctAnswer;
                  return { ...q, choices, correctAnswer };
                })
              }
              onSelectCorrectChoice={(choiceIndex) =>
                updateQuestion(question.id, (q) =>
                  q.type === 'multiple_choice' ? { ...q, correctAnswer: q.choices[choiceIndex] } : q
                )
              }
              onAddChoice={() =>
                updateQuestion(question.id, (q) =>
                  q.type === 'multiple_choice' && q.choices.length < 6
                    ? { ...q, choices: [...q.choices, ''] }
                    : q
                )
              }
              onRemoveChoice={(choiceIndex) =>
                updateQuestion(question.id, (q) => {
                  if (q.type !== 'multiple_choice' || q.choices.length <= 2) return q;
                  const removed = q.choices[choiceIndex];
                  const choices = q.choices.filter((_, i) => i !== choiceIndex);
                  const correctAnswer = q.correctAnswer === removed ? choices[0] : q.correctAnswer;
                  return { ...q, choices, correctAnswer };
                })
              }
              onSelectTrueFalse={(value) =>
                updateQuestion(question.id, (q) => (q.type === 'true_false' ? { ...q, correctAnswer: value } : q))
              }
              onChangeShortAnswer={(text) =>
                updateQuestion(question.id, (q) => (q.type === 'short_answer' ? { ...q, correctAnswer: text } : q))
              }
              onDelete={() => handleDeleteQuestion(question.id)}
            />
          ))}
        </View>

        {publishError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {publishError}
          </Text>
        ) : null}

        <Pressable
          style={[styles.button, isPublishing && styles.buttonDisabled]}
          onPress={handlePublish}
          disabled={isPublishing}
          accessibilityRole="button"
        >
          {isPublishing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Publier le devoir</Text>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

// No technical detail (network vs. RLS vs. RPC failure) is surfaced — a
// stable, actionable French message either way (CLAUDE.md §34/§39). The
// edited quiz stays in memory, so retrying costs nothing.
const PUBLISH_ERROR_MESSAGE =
  "Impossible de publier ce devoir pour le moment. Vérifiez votre connexion et réessayez.";

function parseQuiz(raw: string | undefined): QuizData | null {
  if (!raw) return null;
  try {
    const result = QuizDataSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// Local checks beyond the Zod schema: the schema stays permissive for what
// the AI is allowed to generate (e.g. zero questions plus a warning when a
// lesson is unreadable — CLAUDE.md §20), but a teacher should not be able to
// continue with a draft that got edited into an unusable state.
function findQuizIssues(quiz: QuizData): string[] {
  const issues: string[] = [];
  if (!quiz.title.trim()) issues.push('Le titre est vide.');
  if (!quiz.instructions.trim()) issues.push('La consigne est vide.');
  if (quiz.questions.length === 0) issues.push('Ajoutez au moins une question.');

  quiz.questions.forEach((q, index) => {
    const n = index + 1;
    if (!q.question.trim()) issues.push(`La question ${n} est vide.`);
    if (q.type === 'multiple_choice') {
      if (q.choices.some((c) => !c.trim())) issues.push(`Une réponse de la question ${n} est vide.`);
      if (!q.choices.includes(q.correctAnswer)) {
        issues.push(`Choisissez la bonne réponse pour la question ${n}.`);
      }
    }
    if (q.type === 'short_answer' && !q.correctAnswer.trim()) {
      issues.push(`La réponse attendue de la question ${n} est vide.`);
    }
  });

  return issues;
}

type QuestionCardProps = {
  index: number;
  question: Question;
  onChangeQuestionText: (text: string) => void;
  onChangeChoiceText: (choiceIndex: number, text: string) => void;
  onSelectCorrectChoice: (choiceIndex: number) => void;
  onAddChoice: () => void;
  onRemoveChoice: (choiceIndex: number) => void;
  onSelectTrueFalse: (value: boolean) => void;
  onChangeShortAnswer: (text: string) => void;
  onDelete: () => void;
};

function QuestionCard({
  index,
  question,
  onChangeQuestionText,
  onChangeChoiceText,
  onSelectCorrectChoice,
  onAddChoice,
  onRemoveChoice,
  onSelectTrueFalse,
  onChangeShortAnswer,
  onDelete,
}: QuestionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>Question {index + 1}</Text>
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Supprimer cette question">
          <Text style={styles.deleteText}>Supprimer</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.questionInput}
        value={question.question}
        onChangeText={onChangeQuestionText}
        placeholder="Énoncé de la question"
        accessibilityLabel={`Énoncé de la question ${index + 1}`}
        multiline
      />

      {question.type === 'multiple_choice' && (
        <View style={styles.choiceList}>
          {question.choices.map((choice, choiceIndex) => {
            const isCorrect = choice === question.correctAnswer;
            return (
              <View key={choiceIndex} style={[styles.choiceRow, isCorrect && styles.choiceCorrect]}>
                <Pressable
                  onPress={() => onSelectCorrectChoice(choiceIndex)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isCorrect }}
                  accessibilityLabel="Marquer comme bonne réponse"
                  style={styles.radioTouchArea}
                >
                  <View style={[styles.radioOuter, isCorrect && styles.radioOuterSelected]}>
                    {isCorrect && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
                <TextInput
                  style={styles.choiceInput}
                  value={choice}
                  onChangeText={(text) => onChangeChoiceText(choiceIndex, text)}
                  placeholder="Réponse"
                  accessibilityLabel={`Réponse ${choiceIndex + 1} de la question ${index + 1}`}
                />
                {question.choices.length > 2 && (
                  <Pressable
                    onPress={() => onRemoveChoice(choiceIndex)}
                    accessibilityRole="button"
                    accessibilityLabel="Supprimer cette réponse"
                    hitSlop={8}
                  >
                    <Text style={styles.removeChoiceText}>✕</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {question.choices.length < 6 && (
            <Pressable onPress={onAddChoice} accessibilityRole="button">
              <Text style={styles.addChoiceText}>+ Ajouter une réponse</Text>
            </Pressable>
          )}
        </View>
      )}

      {question.type === 'true_false' && (
        <View style={styles.choiceList}>
          {[true, false].map((value) => {
            const isCorrect = value === question.correctAnswer;
            return (
              <Pressable
                key={String(value)}
                onPress={() => onSelectTrueFalse(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isCorrect }}
                style={[styles.choiceRow, isCorrect && styles.choiceCorrect]}
              >
                <View style={[styles.radioOuter, isCorrect && styles.radioOuterSelected]}>
                  {isCorrect && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.choiceText, isCorrect && styles.choiceTextCorrect]}>
                  {value ? 'Vrai' : 'Faux'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {question.type === 'short_answer' && (
        <View style={styles.shortAnswerRow}>
          <Text style={styles.shortAnswerLabel}>Réponse attendue</Text>
          <TextInput
            style={styles.shortAnswerInput}
            value={question.correctAnswer}
            onChangeText={onChangeShortAnswer}
            placeholder="Réponse attendue"
            accessibilityLabel={`Réponse attendue de la question ${index + 1}`}
          />
        </View>
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
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    padding: 0,
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
  instructionsInput: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 16,
    padding: 0,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777777',
    textTransform: 'uppercase',
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C0392B',
  },
  questionInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    padding: 0,
  },
  choiceList: {
    gap: 8,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  radioTouchArea: {
    padding: 2,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#2E9E5B',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2E9E5B',
  },
  choiceInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    padding: 0,
  },
  choiceText: {
    fontSize: 15,
    color: '#333333',
  },
  choiceTextCorrect: {
    color: '#1F6E40',
    fontWeight: '600',
  },
  removeChoiceText: {
    fontSize: 16,
    color: '#999999',
    paddingHorizontal: 2,
  },
  addChoiceText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  shortAnswerRow: {
    gap: 4,
  },
  shortAnswerLabel: {
    fontSize: 13,
    color: '#1F6E40',
    fontWeight: '600',
  },
  shortAnswerInput: {
    fontSize: 15,
    color: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
