import { useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StepBar, StepLabel } from '@/components/StepIndicator';
import { StickyFooter, useStickyFooterSpace } from '@/components/StickyFooter';
import { useAuth } from '@/features/auth/AuthProvider';
import { OptionChips } from '@/features/exercise-creation/components/OptionChips';
import { Grade, GRADES } from '@shared/domain/grade';
import { Subject, SUBJECTS } from '@shared/domain/subject';
import {
  EXERCISE_TYPES,
  QUESTION_COUNT_OPTIONS,
  QuizType,
} from '@shared/domain/exercise';
import { colors, spacing, type } from '@/theme';

const QUESTION_COUNT_CHOICES = QUESTION_COUNT_OPTIONS.map((count) => ({
  value: count,
  label: String(count),
}));

export default function CreateExerciseScreen() {
  const { profile } = useAuth();
  // Pre-selected from the teacher's class level (collected at onboarding) so
  // the common case is one tap fewer — still freely changeable here for a
  // double-niveau class or a devoir made for another level.
  const [grade, setGrade] = useState<Grade | null>(profile?.classGrade ?? null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const footerSpace = useStickyFooterSpace();

  const canContinue = Boolean(grade && subject && quizType && questionCount);

  function handleContinue() {
    if (!grade || !subject || !quizType || !questionCount) return;
    router.push({
      pathname: '/create-photo',
      params: {
        grade,
        subject,
        quizType,
        questionCount: String(questionCount),
      },
    });
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: footerSpace }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <BackButton onPress={() => router.back()} />
          <StepLabel step={1} />
        </View>
        <StepBar step={1} />

        <Text style={styles.title} accessibilityRole="header">
          Créer un devoir
        </Text>

        <ChoiceGroup label="Niveau">
          <OptionChips
            options={GRADES}
            selected={grade}
            onSelect={setGrade}
            accessibilityLabelPrefix="Niveau"
          />
        </ChoiceGroup>

        <ChoiceGroup label="Matière">
          <OptionChips
            options={SUBJECTS}
            selected={subject}
            onSelect={setSubject}
            accessibilityLabelPrefix="Matière"
          />
        </ChoiceGroup>

        <ChoiceGroup label="Type d’exercice">
          <OptionChips
            options={EXERCISE_TYPES}
            selected={quizType}
            onSelect={setQuizType}
            accessibilityLabelPrefix="Type d'exercice"
          />
        </ChoiceGroup>

        <ChoiceGroup label="Nombre de questions">
          <OptionChips
            options={QUESTION_COUNT_CHOICES}
            selected={questionCount}
            onSelect={setQuestionCount}
            accessibilityLabelPrefix="Nombre de questions"
          />
        </ChoiceGroup>
      </ScrollView>

      <StickyFooter>
        <PrimaryButton
          label="Continuer"
          trailingIcon="arrow-forward"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </StickyFooter>
    </Screen>
  );
}

function ChoiceGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <GlassCard style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  group: {
    padding: 18,
    gap: spacing.md,
  },
  groupLabel: {
    ...type.labelStrong,
    color: colors.text,
  },
});
