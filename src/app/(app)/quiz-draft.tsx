import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { QuizRecapPills } from '@/components/Pill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { showAlert } from '@/components/showAlert';
import { StepLabel } from '@/components/StepIndicator';
import { Tip } from '@/components/Tip';
import { StickyFooter, useStickyFooterSpace } from '@/components/StickyFooter';
import { TextField } from '@/components/TextField';
import { supabase } from '@shared/supabase/client';
import { GRADES } from '@shared/domain/grade';
import { SUBJECTS } from '@shared/domain/subject';
import { EXERCISE_TYPES } from '@shared/domain/exercise';
import { BLANK_MARKER, QuizDataSchema, type Question, type QuizData } from '@shared/domain/quiz';
import { LESSON_MODE_LABELS, LESSON_MODES, type LessonMode } from '@shared/domain/lessonMode';
import { colors, radii, sequenceGradients, shadows, sizes, spacing, type } from '@/theme';

// Editable preview of the AI-generated draft (Milestone 6), now wired to
// publishing (Milestone 7). The teacher stays in control of the final
// content (CLAUDE.md §6): title, instructions, question text, answers and
// multiple-choice options can all be edited, and questions can be removed.
// The edited quiz lives only in this screen's state until "Publier" is
// pressed — there is no separate "save draft" step (see PROGRESS.md,
// Milestone 6 decision).
export default function QuizDraftScreen() {
  const { quiz: quizParam, lessonMode: lessonModeParam } = useLocalSearchParams<{
    quiz: string;
    lessonMode?: string;
  }>();
  const [quiz, setQuiz] = useState<QuizData | null>(() => parseQuiz(quizParam));
  const lessonMode = parseLessonMode(lessonModeParam);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const footerSpace = useStickyFooterSpace();

  if (!quiz) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <BackButton onPress={() => router.back()} />
          <EmptyState
            variant="problem"
            icon="search-outline"
            title="Devoir introuvable"
            body="Ce devoir n’est plus disponible. Retournez à l’accueil et réessayez."
            action={{ label: 'Retour à l’accueil', onPress: () => router.replace('/') }}
          />
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
  const questionCountLabel = `${currentQuiz.questions.length} question${
    currentQuiz.questions.length > 1 ? 's' : ''
  }`;

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

  function handleAddQuestion(type: Question['type']) {
    setQuiz((prev) =>
      prev ? { ...prev, questions: [...prev.questions, makeEmptyQuestion(type)] } : prev
    );
  }

  function promptAddQuestion() {
    showAlert(
      'Ajouter une question',
      'Choisissez le type de question.',
      [
        { text: 'Choix multiple', onPress: () => handleAddQuestion('multiple_choice') },
        { text: 'Vrai ou Faux', onPress: () => handleAddQuestion('true_false') },
        { text: 'Texte à trous', onPress: () => handleAddQuestion('gap_fill') },
        { text: 'Annuler', style: 'cancel' },
      ],
      // Android alerts keep only their first 3 buttons, so "Annuler" is
      // dropped there: tapping outside / the back button must dismiss instead.
      { cancelable: true }
    );
  }

  function handleDeleteQuestion(questionId: string) {
    showAlert('Supprimer cette question ?', 'Cette action est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          setQuiz((prev) =>
            prev ? { ...prev, questions: prev.questions.filter((q) => q.id !== questionId) } : prev
          ),
      },
      { text: 'Annuler' },
    ]);
  }

  async function handlePublish() {
    const issues = findQuizIssues(currentQuiz);
    if (issues.length > 0) {
      showAlert('Devoir incomplet', issues[0]);
      return;
    }
    if (!QuizDataSchema.safeParse(currentQuiz).success) {
      showAlert('Devoir incomplet', 'Vérifiez les questions et les réponses avant de continuer.');
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
        contentContainerStyle={[styles.content, { paddingBottom: footerSpace }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <BackButton onPress={() => router.back()} />
          <StepLabel step={3} suffix="Relecture" />
        </View>

        <Tip
          id="quiz-review"
          text="Vos élèves ne voient rien tant que vous n’avez pas publié. Touchez une question pour la modifier."
        />

        <GlassCard style={styles.summary}>
          <TextField
            label="Titre du devoir"
            labelVariant="caps"
            value={currentQuiz.title}
            onChangeText={(text) => setQuiz((prev) => (prev ? { ...prev, title: text } : prev))}
            placeholder="Titre du devoir"
            inputStyle={styles.titleInput}
          />
          <QuizRecapPills
            labels={[gradeLabel, subjectLabel, quizTypeLabel, questionCountLabel]}
            size="sm"
          />
          <View style={styles.instructionsField}>
            <TextField
              label="Consigne pour l’élève"
              labelVariant="caps"
              value={currentQuiz.instructions}
              onChangeText={(text) =>
                setQuiz((prev) => (prev ? { ...prev, instructions: text } : prev))
              }
              placeholder="Consigne pour l'élève"
              multiline
              inputStyle={styles.instructionsInput}
            />
          </View>
        </GlassCard>

        {lessonMode && <Banner tone="info" messages={LESSON_MODE_LABELS[lessonMode]} />}

        {currentQuiz.warnings.length > 0 && <Banner tone="warning" messages={currentQuiz.warnings} />}

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
                if (!isChoiceQuestion(q)) return q;
                const oldChoice = q.choices[choiceIndex];
                const choices = q.choices.map((c, i) => (i === choiceIndex ? text : c));
                const correctAnswer = q.correctAnswer === oldChoice ? text : q.correctAnswer;
                return { ...q, choices, correctAnswer };
              })
            }
            onSelectCorrectChoice={(choiceIndex) =>
              updateQuestion(question.id, (q) =>
                isChoiceQuestion(q) ? { ...q, correctAnswer: q.choices[choiceIndex] } : q
              )
            }
            onAddChoice={() =>
              updateQuestion(question.id, (q) =>
                isChoiceQuestion(q) && q.choices.length < maxChoicesFor(q)
                  ? { ...q, choices: [...q.choices, ''] }
                  : q
              )
            }
            onRemoveChoice={(choiceIndex) =>
              updateQuestion(question.id, (q) => {
                if (!isChoiceQuestion(q) || q.choices.length <= 2) return q;
                const removed = q.choices[choiceIndex];
                const choices = q.choices.filter((_, i) => i !== choiceIndex);
                const correctAnswer = q.correctAnswer === removed ? choices[0] : q.correctAnswer;
                return { ...q, choices, correctAnswer };
              })
            }
            onSelectTrueFalse={(value) =>
              updateQuestion(question.id, (q) => (q.type === 'true_false' ? { ...q, correctAnswer: value } : q))
            }
            onDelete={() => handleDeleteQuestion(question.id)}
          />
        ))}

        <Pressable
          style={({ pressed }) => [styles.addQuestionButton, pressed && styles.pressed]}
          onPress={promptAddQuestion}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color={colors.actionText} />
          <Text style={styles.addQuestionText}>Ajouter une question</Text>
        </Pressable>
      </ScrollView>

      <StickyFooter>
        {/* Shown right above the button, not at the end of a long scroll,
            so the teacher sees why nothing happened. */}
        {publishError ? (
          <View style={styles.footerError}>
            <Banner tone="error" messages={publishError} />
          </View>
        ) : null}
        <PrimaryButton
          label="Publier le devoir"
          icon="paper-plane-outline"
          onPress={handlePublish}
          loading={isPublishing}
        />
      </StickyFooter>
    </Screen>
  );
}

// No technical detail (network vs. RLS vs. RPC failure) is surfaced — a
// stable, actionable French message either way (CLAUDE.md §34/§39). The
// edited quiz stays in memory, so retrying costs nothing.
const PUBLISH_ERROR_MESSAGE =
  "Impossible de publier ce devoir pour le moment. Vérifiez votre connexion et réessayez.";

// A blank question the teacher fills in from the review screen. `explanation`
// and `sourceEvidence` stay empty — neither applies to a hand-added question
// (the shared schema allows empty strings for exactly this case), and
// `sourceEvidence` is stripped from the published quiz anyway.
function makeEmptyQuestion(type: Question['type']): Question {
  const base = {
    id: `q-added-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question: '',
    explanation: '',
    sourceEvidence: '',
  };
  switch (type) {
    case 'multiple_choice':
      return { ...base, type, choices: ['', ''], correctAnswer: '' };
    case 'true_false':
      return { ...base, type, correctAnswer: true };
    case 'gap_fill':
      return { ...base, type, question: `Complète : … ${BLANK_MARKER} …`, choices: ['', ''], correctAnswer: '' };
  }
}

// multiple_choice and gap_fill both edit a list of choices with one marked
// correct — the editor treats them the same.
type ChoiceQuestion = Extract<Question, { type: 'multiple_choice' | 'gap_fill' }>;

function isChoiceQuestion(q: Question): q is ChoiceQuestion {
  return q.type === 'multiple_choice' || q.type === 'gap_fill';
}

function maxChoicesFor(q: ChoiceQuestion): number {
  return q.type === 'gap_fill' ? 4 : 6;
}

function parseLessonMode(raw: string | undefined): LessonMode | null {
  return raw && (LESSON_MODES as string[]).includes(raw) ? (raw as LessonMode) : null;
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
    if (q.type === 'multiple_choice' || q.type === 'gap_fill') {
      if (q.choices.some((c) => !c.trim())) issues.push(`Une réponse de la question ${n} est vide.`);
      if (!q.choices.includes(q.correctAnswer)) {
        issues.push(`Choisissez la bonne réponse pour la question ${n}.`);
      }
    }
    if (q.type === 'gap_fill' && !q.question.includes(BLANK_MARKER)) {
      issues.push(`La question ${n} (texte à trous) doit contenir le trou « ${BLANK_MARKER} ».`);
    }
  });

  return issues;
}

// Card label and number-badge gradient per question type, so a teacher can
// tell the types apart while scrolling a mixed quiz.
const QUESTION_TYPE_STYLE: Record<Question['type'], { label: string; gradient: number }> = {
  multiple_choice: { label: 'Choix multiple', gradient: 0 },
  true_false: { label: 'Vrai ou Faux', gradient: 1 },
  gap_fill: { label: 'Texte à trous', gradient: 2 },
};

type QuestionCardProps = {
  index: number;
  question: Question;
  onChangeQuestionText: (text: string) => void;
  onChangeChoiceText: (choiceIndex: number, text: string) => void;
  onSelectCorrectChoice: (choiceIndex: number) => void;
  onAddChoice: () => void;
  onRemoveChoice: (choiceIndex: number) => void;
  onSelectTrueFalse: (value: boolean) => void;
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
  onDelete,
}: QuestionCardProps) {
  const typeStyle = QUESTION_TYPE_STYLE[question.type];
  const number = index + 1;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeading}>
          <LinearGradient {...sequenceGradients[typeStyle.gradient]} style={styles.numberBadge}>
            <Text style={styles.numberText}>{number}</Text>
          </LinearGradient>
          <Text style={styles.typeLabel}>{typeStyle.label}</Text>
        </View>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer la question ${number}`}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger.text} />
        </Pressable>
      </View>

      <TextField
        value={question.question}
        onChangeText={onChangeQuestionText}
        placeholder={
          question.type === 'gap_fill'
            ? `Phrase à compléter (mettez ${BLANK_MARKER} à l'endroit du trou)`
            : 'Énoncé de la question'
        }
        accessibilityLabel={`Énoncé de la question ${number}`}
        multiline
        inputStyle={styles.questionInput}
      />

      {question.type === 'gap_fill' && (
        <Text style={styles.gapHint}>
          Le trou est noté {BLANK_MARKER}. L&apos;élève choisit le bon mot parmi les réponses
          ci-dessous.
        </Text>
      )}

      {(question.type === 'multiple_choice' || question.type === 'gap_fill') && (
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
                  hitSlop={10}
                >
                  <View style={[styles.radioOuter, isCorrect && styles.radioOuterSelected]}>
                    {isCorrect && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
                <TextInput
                  style={[styles.choiceInput, isCorrect && styles.choiceInputCorrect]}
                  value={choice}
                  onChangeText={(text) => onChangeChoiceText(choiceIndex, text)}
                  placeholder="Réponse"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={`Réponse ${choiceIndex + 1} de la question ${number}`}
                />
                {isCorrect && <Text style={styles.correctTag}>Bonne réponse</Text>}
                {question.choices.length > 2 && (
                  <Pressable
                    onPress={() => onRemoveChoice(choiceIndex)}
                    accessibilityRole="button"
                    accessibilityLabel="Supprimer cette réponse"
                    style={styles.removeChoice}
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            );
          })}
          {question.choices.length < maxChoicesFor(question) && (
            <Pressable
              onPress={onAddChoice}
              accessibilityRole="button"
              style={styles.addChoice}
              hitSlop={4}
            >
              <Text style={styles.addChoiceText}>+ Ajouter une réponse</Text>
            </Pressable>
          )}
        </View>
      )}

      {question.type === 'true_false' && (
        <View style={styles.trueFalseRow} accessibilityRole="radiogroup" accessibilityLabel="Bonne réponse">
          {[true, false].map((value) => {
            const isCorrect = value === question.correctAnswer;
            return (
              <Pressable
                key={String(value)}
                onPress={() => onSelectTrueFalse(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isCorrect }}
                style={[styles.trueFalseOption, isCorrect && styles.choiceCorrect]}
              >
                {isCorrect && <Ionicons name="checkmark" size={18} color={colors.success.text} />}
                <Text style={[styles.trueFalseText, isCorrect && styles.trueFalseTextCorrect]}>
                  {value ? 'Vrai' : 'Faux'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

const CHOICE_HEIGHT = 52;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: 48,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  summary: {
    padding: 18,
    gap: spacing.md,
    borderRadius: 26,
    backgroundColor: colors.surfaceGlassStrong,
    boxShadow: shadows.panel,
  },
  titleInput: {
    ...type.inputTitle,
  },
  instructionsField: {
    marginTop: spacing.xs,
  },
  instructionsInput: {
    ...type.input,
    minHeight: 74,
  },
  card: {
    padding: 18,
    gap: spacing.md,
    backgroundColor: colors.surfaceGlassStrong,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...type.labelStrong,
    color: colors.textOnBrand,
  },
  typeLabel: {
    ...type.metaStrong,
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger.background,
  },
  questionInput: {
    ...type.bodyEmphasis,
    minHeight: 60,
    borderRadius: radii.field,
  },
  gapHint: {
    ...type.meta,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  choiceList: {
    gap: 10,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: CHOICE_HEIGHT,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceCorrect: {
    borderWidth: 1.5,
    borderColor: colors.success.border,
    backgroundColor: colors.success.background,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.success.border,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success.border,
  },
  choiceInput: {
    ...type.input,
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    color: colors.text,
  },
  choiceInputCorrect: {
    fontFamily: type.bodyStrong.fontFamily,
  },
  correctTag: {
    ...type.metaStrong,
    fontSize: 12,
    color: colors.success.text,
  },
  removeChoice: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChoice: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  addChoiceText: {
    ...type.labelStrong,
    color: colors.actionText,
  },
  trueFalseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  trueFalseOption: {
    flex: 1,
    height: CHOICE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  trueFalseText: {
    ...type.body,
    fontFamily: type.label.fontFamily,
    color: colors.text,
  },
  trueFalseTextCorrect: {
    fontFamily: type.bodyStrong.fontFamily,
    color: colors.success.text,
  },
  addQuestionButton: {
    minHeight: sizes.secondaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    backgroundColor: colors.surfaceGlassFaint,
  },
  footerError: {
    marginBottom: spacing.md,
  },
  addQuestionText: {
    ...type.buttonSecondary,
    color: colors.actionText,
  },
});
