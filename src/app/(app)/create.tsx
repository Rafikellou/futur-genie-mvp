import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { OptionChips } from '@/features/exercise-creation/components/OptionChips';
import { Grade, GRADES } from '@shared/domain/grade';
import { Subject, SUBJECTS } from '@shared/domain/subject';
import {
  EXERCISE_TYPES,
  QUESTION_COUNT_OPTIONS,
  QuizType,
} from '@shared/domain/exercise';
import { COLORS } from '@/theme/colors';

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
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>‹ Retour</Text>
        </Pressable>

        <Text style={styles.title}>Créer un devoir</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Niveau</Text>
          <OptionChips
            options={GRADES}
            selected={grade}
            onSelect={setGrade}
            accessibilityLabelPrefix="Niveau"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Matière</Text>
          <OptionChips
            options={SUBJECTS}
            selected={subject}
            onSelect={setSubject}
            accessibilityLabelPrefix="Matière"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Type d&apos;exercice</Text>
          <OptionChips
            options={EXERCISE_TYPES}
            selected={quizType}
            onSelect={setQuizType}
            accessibilityLabelPrefix="Type d'exercice"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nombre de questions</Text>
          <OptionChips
            options={QUESTION_COUNT_CHOICES}
            selected={questionCount}
            onSelect={setQuestionCount}
            accessibilityLabelPrefix="Nombre de questions"
          />
        </View>

        <Pressable
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Continuer</Text>
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
  },
  back: {
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    gap: 10,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
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
