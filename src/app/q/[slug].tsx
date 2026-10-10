import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { HeroCard } from '@/components/HeroCard';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StickyFooter, useStickyFooterSpace } from '@/components/StickyFooter';

// Deliberately outside the (app)/(auth) route groups (see src/app/_layout.tsx):
// neither Stack.Protected guard covers this file, so it renders without a
// teacher session — this is the student-facing public route (CLAUDE.md §8).
import { supabase } from '@shared/supabase/client';
import { TEACHER_TITLES } from '@shared/domain/title';
import {
  BLANK_MARKER,
  PublicQuizDataSchema,
  type PublicQuestion,
  type PublicQuizData,
} from '@shared/domain/quiz';
import {
  areAllAnswered,
  createEmptyAnswers,
  gradeQuiz,
  type AnswerMap,
  type StudentAnswer,
} from '@/features/quiz-taking/grading';
import { submitSubmission } from '@/features/quiz-taking/submitSubmission';
import { colors, fonts, gradients, radii, shadows, sizes, spacing, type } from '@/theme';

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
//
// Kept light for the web (docs/design/README §5.7): no assets beyond the
// logo and the shared halo background.
export default function PublicQuizScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const footerSpace = useStickyFooterSpace();
  // The quiz screen stays scrolled wherever the student left off when they
  // submit; scroll it back to the top so the score is what they see next.
  const scrollRef = useRef<ScrollView>(null);
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
        .select('public_quiz_data, teacher_name')
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

      const rawTeacherName = (data as { teacher_name?: unknown }).teacher_name;
      setTeacherName(
        typeof rawTeacherName === 'string' && rawTeacherName.trim().length > 0
          ? rawTeacherName.trim()
          : null
      );

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
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandViolet} />
          <Text style={styles.centeredBody}>Chargement du devoir…</Text>
        </View>
      </Screen>
    );
  }

  if (state.status === 'not_found') {
    return (
      <Screen>
        <View style={styles.centered}>
          <Logo size={44} showWordmark={false} />
          <Text style={styles.centeredTitle}>Devoir introuvable</Text>
          <Text style={styles.centeredBody}>
            Ce lien n&apos;est plus valable. Demandez à votre enseignant·e de vous en renvoyer
            un.
          </Text>
        </View>
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen>
        <View style={styles.centered}>
          <Logo size={44} showWordmark={false} />
          <Text style={styles.centeredTitle}>Impossible d&apos;ouvrir ce devoir</Text>
          <Text style={styles.centeredBody}>Vérifiez votre connexion Internet puis réessayez.</Text>
          <PrimaryButton label="Réessayer" onPress={load} style={styles.centeredButton} />
        </View>
      </Screen>
    );
  }

  const { quiz } = state;
  const allAnswered = areAllAnswered(quiz.questions, answers);
  const summary = submitted ? gradeQuiz(quiz.questions, answers) : null;
  const trimmedName = studentName.trim();

  const setMultipleChoiceAnswer = (questionId: string, choice: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { type: 'multiple_choice', value: choice } }));
  };

  const setTrueFalseAnswer = (questionId: string, value: boolean) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { type: 'true_false', value } }));
  };

  const setGapFillAnswer = (questionId: string, choice: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { type: 'gap_fill', value: choice } }));
  };

  const handleRetry = () => {
    setAnswers(createEmptyAnswers(quiz.questions));
    setSubmitted(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // Defer past this render so the score box exists before we scroll to it.
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
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
    const teacherInitials = initialsOf(teacherName);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo size={36} />

          <View style={styles.invitation}>
            <LinearGradient {...gradients.selected} style={styles.teacherAvatar}>
              {teacherInitials ? (
                <Text style={styles.teacherAvatarText}>{teacherInitials}</Text>
              ) : (
                <Ionicons name="school-outline" size={20} color={colors.textOnBrand} />
              )}
            </LinearGradient>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                Ton enseignant·e{' '}
                {teacherName ? <Text style={styles.speechStrong}>{teacherName} </Text> : null}
                te propose ce quiz pour continuer à progresser !
              </Text>
            </View>
          </View>

          <HeroCard>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              {quiz.title}
            </Text>
            <Text style={styles.heroBody}>{quiz.instructions}</Text>
          </HeroCard>

          <View style={styles.nameField}>
            <Text style={styles.nameLabel}>Ton prénom</Text>
            <StudentNameInput value={studentName} onChangeText={setStudentName} />
          </View>

          <PrimaryButton
            label="C’est parti !"
            trailingIcon="arrow-forward"
            size="large"
            onPress={() => setStarted(true)}
            disabled={trimmedName.length === 0}
          />
        </ScrollView>
      </Screen>
    );
  }

  const answeredCount = quiz.questions.filter((q) => answers[q.id]?.value != null).length;

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          // The footer also carries a one-line hint under the button.
          !submitted && { paddingBottom: footerSpace + SUBMIT_HINT_SPACE },
        ]}
      >
        <Logo size={30} />

        {summary ? (
          <>
            <HeroCard contentStyle={styles.scoreCard}>
              <View accessibilityRole="summary" accessible>
                <Text style={styles.scoreGreeting}>Bien joué {trimmedName} !</Text>
                <Text style={styles.scoreValue}>
                  {summary.correctCount}
                  <Text style={styles.scoreTotal}> / {summary.gradableCount}</Text>
                </Text>
                <Text style={styles.scoreLabel}>
                  bonne{summary.correctCount > 1 ? 's' : ''} réponse
                  {summary.correctCount > 1 ? 's' : ''}
                </Text>
              </View>
            </HeroCard>
            <Text style={styles.correctionTitle} accessibilityRole="header">
              La correction
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title} accessibilityRole="header">
              {quiz.title}
            </Text>
            <Text style={styles.instructions}>{quiz.instructions}</Text>
            <ProgressHeader
              studentName={trimmedName}
              answered={answeredCount}
              total={quiz.questions.length}
            />
          </>
        )}

        {quiz.questions.map((question, index) => {
          const answer = answers[question.id];
          const result = summary?.results.find((r) => r.questionId === question.id) ?? null;

          return (
            <View key={question.id} style={styles.card}>
              <Text style={styles.cardLabel}>Question {index + 1}</Text>

              {question.type === 'gap_fill' ? (
                <GapFillSentence
                  sentence={question.question}
                  filledWith={
                    submitted ? question.correctAnswer : answer?.type === 'gap_fill' ? answer.value : null
                  }
                  isCorrection={submitted}
                />
              ) : (
                <Text style={styles.questionText}>{question.question}</Text>
              )}

              {submitted ? (
                <Correction question={question} answer={answer} />
              ) : (
                <AnswerOptions
                  question={question}
                  answer={answer}
                  onPickChoice={(choice) =>
                    question.type === 'gap_fill'
                      ? setGapFillAnswer(question.id, choice)
                      : setMultipleChoiceAnswer(question.id, choice)
                  }
                  onPickTrueFalse={(value) => setTrueFalseAnswer(question.id, value)}
                />
              )}

              {submitted && result && (
                <View style={styles.feedbackRow}>
                  <Ionicons
                    name={result.isCorrect ? 'checkmark' : 'sparkles-outline'}
                    size={18}
                    color={result.isCorrect ? colors.success.text : colors.warning.textSoft}
                  />
                  <Text style={result.isCorrect ? styles.feedbackCorrect : styles.feedbackAlmost}>
                    {result.isCorrect ? 'Bonne réponse !' : 'Presque ! La bonne réponse est en vert.'}
                  </Text>
                </View>
              )}

              {submitted && question.explanation ? (
                <Text style={styles.explanation}>{question.explanation}</Text>
              ) : null}
            </View>
          );
        })}

        {submitted && (
          <Pressable
            onPress={handleRetry}
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Ionicons name="refresh" size={20} color={colors.actionText} />
            <Text style={styles.retryText}>Recommencer</Text>
          </Pressable>
        )}
      </ScrollView>

      {!submitted && quiz.questions.length > 0 && (
        <StickyFooter>
          <PrimaryButton
            label="Valider mes réponses"
            size="large"
            onPress={handleSubmit}
            disabled={!allAnswered}
          />
          {!allAnswered && (
            <Text style={styles.submitHint}>Réponds à toutes les questions pour valider.</Text>
          )}
        </StickyFooter>
      )}
    </Screen>
  );
}

// "Mme Dupont" → "D": the civility isn't part of the initials.
function initialsOf(name: string | null): string {
  if (!name) return '';
  const titles = TEACHER_TITLES.map((t) => t.value as string);
  return name
    .split(/\s+/)
    .filter((word) => word && !titles.includes(word))
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function StudentNameInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Ton prénom"
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.brandViolet}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[styles.nameInput, isFocused && styles.nameInputFocused]}
      accessibilityLabel="Ton prénom"
    />
  );
}

// Encouragement + "x / n répondues" bar, computed locally from the answers.
function ProgressHeader({
  studentName,
  answered,
  total,
}: {
  studentName: string;
  answered: number;
  total: number;
}) {
  const message =
    answered === 0
      ? `À toi de jouer, ${studentName} !`
      : answered === total
        ? `Bravo ${studentName}, tu peux valider !`
        : `Bravo ${studentName}, continue !`;
  return (
    <View style={styles.progress}>
      <View style={styles.progressLabels}>
        <Text style={styles.progressMessage}>{message}</Text>
        <Text style={styles.progressCount}>
          {answered} / {total} répondue{answered > 1 ? 's' : ''}
        </Text>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel="Questions répondues"
        accessibilityValue={{ min: 0, max: total, now: answered }}
      >
        {answered > 0 && (
          <LinearGradient
            {...gradients.progress}
            style={[styles.progressFill, { width: `${(answered / total) * 100}%` }]}
          />
        )}
      </View>
    </View>
  );
}

function AnswerOptions({
  question,
  answer,
  onPickChoice,
  onPickTrueFalse,
}: {
  question: PublicQuestion;
  answer: StudentAnswer | undefined;
  onPickChoice: (choice: string) => void;
  onPickTrueFalse: (value: boolean) => void;
}) {
  if (question.type === 'true_false') {
    return (
      <View style={styles.trueFalseRow} accessibilityRole="radiogroup">
        {([true, false] as const).map((value) => {
          const label = value ? 'Vrai' : 'Faux';
          const isSelected = answer?.type === 'true_false' && answer.value === value;
          return (
            <Pressable
              key={label}
              onPress={() => onPickTrueFalse(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[styles.trueFalseOption, isSelected && styles.optionSelected]}
            >
              <Text style={[styles.trueFalseText, isSelected && styles.optionTextSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const isGapFill = question.type === 'gap_fill';
  return (
    <View style={isGapFill ? styles.wordList : styles.choiceList} accessibilityRole="radiogroup">
      {question.choices.map((choice, choiceIndex) => {
        const isSelected =
          (answer?.type === 'multiple_choice' || answer?.type === 'gap_fill') &&
          answer.value === choice;
        return (
          <Pressable
            key={choiceIndex}
            onPress={() => onPickChoice(choice)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={[isGapFill ? styles.wordOption : styles.choiceOption, isSelected && styles.optionSelected]}
          >
            {!isGapFill && (
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            )}
            <Text style={[styles.choiceText, isSelected && styles.optionTextSelected]}>{choice}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// After submission: the right answer in green with a check icon; the
// student's wrong pick (if any) in soft orange, dashed, labelled "Ton choix"
// — never red, never color alone (docs/design/README §5.3, CLAUDE.md §37).
function Correction({
  question,
  answer,
}: {
  question: PublicQuestion;
  answer: StudentAnswer | undefined;
}) {
  if (question.type === 'true_false') {
    return (
      <View style={styles.trueFalseRow}>
        {([true, false] as const).map((value) => {
          const label = value ? 'Vrai' : 'Faux';
          const isCorrect = value === question.correctAnswer;
          const isPicked = answer?.type === 'true_false' && answer.value === value;
          return (
            <CorrectionOption
              key={label}
              label={label}
              state={isCorrect ? 'correct' : isPicked ? 'picked' : 'other'}
              centered
            />
          );
        })}
      </View>
    );
  }

  const picked =
    answer?.type === 'multiple_choice' || answer?.type === 'gap_fill' ? answer.value : null;
  const gotItRight = picked === question.correctAnswer;

  // Gap fill: the sentence above already shows the right word in green; the
  // words are only repeated when the student picked another one.
  if (question.type === 'gap_fill') {
    if (gotItRight) return null;
    return (
      <View style={styles.choiceList}>
        <CorrectionOption label={question.correctAnswer} state="correct" />
        {picked ? <CorrectionOption label={picked} state="picked" /> : null}
      </View>
    );
  }

  return (
    <View style={styles.choiceList}>
      {question.choices.map((choice, choiceIndex) => (
        <CorrectionOption
          key={choiceIndex}
          label={choice}
          state={
            choice === question.correctAnswer ? 'correct' : choice === picked ? 'picked' : 'other'
          }
        />
      ))}
    </View>
  );
}

function CorrectionOption({
  label,
  state,
  centered = false,
}: {
  label: string;
  state: 'correct' | 'picked' | 'other';
  centered?: boolean;
}) {
  return (
    <View
      style={[
        styles.correctionOption,
        centered && styles.correctionCentered,
        state === 'correct' && styles.correctionCorrect,
        state === 'picked' && styles.correctionPicked,
      ]}
      accessibilityLabel={
        state === 'correct'
          ? `${label}, bonne réponse`
          : state === 'picked'
            ? `${label}, ton choix`
            : label
      }
      accessible
    >
      {state === 'correct' && (
        <Ionicons name="checkmark-circle" size={22} color={colors.success.border} />
      )}
      {state === 'picked' && <Text style={styles.pickedTag}>Ton choix</Text>}
      <Text
        style={[
          styles.correctionText,
          state === 'correct' && styles.correctionTextCorrect,
          state === 'picked' && styles.correctionTextPicked,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// A "texte à trous" sentence with its blank shown inline: an empty slot before
// the student answers, the chosen word once they pick one — and the right
// word, in green, in the correction.
function GapFillSentence({
  sentence,
  filledWith,
  isCorrection,
}: {
  sentence: string;
  filledWith: string | null;
  isCorrection: boolean;
}) {
  const markerIndex = sentence.indexOf(BLANK_MARKER);
  const before = markerIndex >= 0 ? sentence.slice(0, markerIndex) : sentence;
  const after = markerIndex >= 0 ? sentence.slice(markerIndex + BLANK_MARKER.length) : '';

  return (
    <Text style={[styles.questionText, styles.gapSentence]}>
      {before}
      <Text
        style={[
          styles.gap,
          filledWith ? styles.gapFilled : styles.gapEmpty,
          isCorrection && styles.gapCorrect,
        ]}
      >
        {filledWith ? ` ${filledWith} ` : '  …  '}
      </Text>
      {after}
    </Text>
  );
}

const STUDENT_CARD_RADIUS = 26;
const SUBMIT_HINT_SPACE = 28;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: 40,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  centeredTitle: {
    ...type.heroTitle,
    color: colors.text,
    textAlign: 'center',
  },
  centeredBody: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  centeredButton: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  invitation: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  teacherAvatar: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textOnBrand,
  },
  speechBubble: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.surface,
    boxShadow: shadows.speechBubble,
  },
  speechText: {
    ...type.body,
    lineHeight: 23,
    color: colors.text,
  },
  speechStrong: {
    fontFamily: fonts.bodySemiBold,
  },
  countPill: {
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    justifyContent: 'center',
    backgroundColor: colors.onBrandBadge,
  },
  countPillText: {
    ...type.metaStrong,
    color: colors.textOnBrand,
  },
  heroTitle: {
    ...type.title,
    lineHeight: 33,
    color: colors.textOnBrand,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heroBody: {
    ...type.body,
    lineHeight: 23,
    color: colors.textOnBrandSoft,
  },
  nameField: {
    gap: spacing.sm,
  },
  nameLabel: {
    ...type.bodyEmphasis,
    fontSize: 17,
    color: colors.text,
  },
  nameInput: {
    fontFamily: fonts.body,
    fontSize: 20,
    height: 60,
    paddingHorizontal: 18,
    borderRadius: radii.row,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  nameInputFocused: {
    borderColor: colors.brandViolet,
    boxShadow: shadows.focusRing,
  },
  title: {
    ...type.heroTitle,
    color: colors.text,
  },
  instructions: {
    ...type.body,
    lineHeight: 23,
    color: colors.textBody,
    marginTop: -spacing.sm,
  },
  progress: {
    gap: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressMessage: {
    ...type.labelStrong,
    flex: 1,
    color: colors.text,
  },
  progressCount: {
    ...type.labelStrong,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  card: {
    gap: 14,
    padding: spacing.xl,
    borderRadius: STUDENT_CARD_RADIUS,
    backgroundColor: colors.surface,
    boxShadow: shadows.studentCard,
  },
  cardLabel: {
    ...type.metaStrong,
    letterSpacing: 0.78,
    textTransform: 'uppercase',
    color: colors.brandViolet,
  },
  questionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    lineHeight: 27,
    color: colors.text,
  },
  gapSentence: {
    lineHeight: 32,
  },
  gap: {
    fontFamily: fonts.bodySemiBold,
  },
  gapEmpty: {
    color: colors.tint.violet.text,
    backgroundColor: colors.tint.violet.background,
  },
  gapFilled: {
    color: colors.tint.violet.text,
    backgroundColor: colors.tint.violet.background,
  },
  gapCorrect: {
    color: colors.success.text,
    backgroundColor: colors.success.background,
  },
  choiceList: {
    gap: 10,
  },
  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.row,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wordList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordOption: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: colors.brandViolet,
    backgroundColor: colors.selectedSoft,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.brandViolet,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandViolet,
  },
  choiceText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    flexShrink: 1,
    color: colors.text,
  },
  optionTextSelected: {
    fontFamily: fonts.bodySemiBold,
  },
  trueFalseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  trueFalseOption: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.row,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  trueFalseText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 19,
    color: colors.text,
  },
  correctionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.row,
    borderWidth: 1.5,
    borderColor: colors.trackSoft,
  },
  correctionCentered: {
    justifyContent: 'center',
    gap: spacing.sm,
  },
  correctionCorrect: {
    borderWidth: 2,
    borderColor: colors.success.border,
    backgroundColor: colors.success.background,
  },
  correctionPicked: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.warning.border,
    backgroundColor: colors.warning.backgroundSoft,
  },
  pickedTag: {
    ...type.metaStrong,
    fontSize: 12,
    color: colors.warning.textSoft,
  },
  correctionText: {
    fontFamily: fonts.body,
    fontSize: 17,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  correctionTextCorrect: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.text,
  },
  correctionTextPicked: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.warning.text,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  feedbackCorrect: {
    ...type.bodyEmphasis,
    flex: 1,
    color: colors.success.text,
  },
  feedbackAlmost: {
    ...type.bodyEmphasis,
    flex: 1,
    color: colors.warning.textSoft,
  },
  explanation: {
    ...type.body,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    color: colors.textBody,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  scoreGreeting: {
    ...type.bodyEmphasis,
    color: colors.textOnBrandSoft,
    textAlign: 'center',
  },
  scoreValue: {
    fontFamily: fonts.heading,
    fontSize: 56,
    lineHeight: 62,
    color: colors.textOnBrand,
    textAlign: 'center',
    marginTop: 6,
  },
  scoreTotal: {
    fontSize: 32,
    color: colors.textOnBrandSoft,
  },
  scoreLabel: {
    ...type.bodyEmphasis,
    fontSize: 17,
    color: colors.textOnBrand,
    textAlign: 'center',
  },
  correctionTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.text,
    marginTop: spacing.xs,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: sizes.primaryButton,
    borderRadius: radii.chip,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  retryText: {
    ...type.bodyEmphasis,
    fontSize: 17,
    color: colors.actionText,
  },
  submitHint: {
    ...type.label,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
