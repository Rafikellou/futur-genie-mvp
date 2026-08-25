import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EXERCISE_TYPES } from '@shared/domain/exercise';
import { GRADES } from '@shared/domain/grade';
import { SUBJECTS } from '@shared/domain/subject';

// Placeholder for Milestone 4 (camera / photo library). Its purpose here is
// only to keep the create-exercise flow navigable end to end and to prove
// out passing the selected parameters forward via route params.
export default function CreatePhotoScreen() {
  const { grade, subject, quizType, questionCount } = useLocalSearchParams<{
    grade: string;
    subject: string;
    quizType: string;
    questionCount: string;
  }>();

  const gradeLabel = GRADES.find((g) => g.value === grade)?.label ?? grade;
  const subjectLabel = SUBJECTS.find((s) => s.value === subject)?.label ?? subject;
  const quizTypeLabel = EXERCISE_TYPES.find((t) => t.value === quizType)?.label ?? quizType;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.back}>‹ Retour</Text>
      </Pressable>

      <Text style={styles.title}>Photo de la leçon</Text>
      <Text style={styles.subtitle}>
        {gradeLabel} · {subjectLabel} · {quizTypeLabel} · {questionCount} questions
      </Text>

      <Text style={styles.body}>
        La prise de photo arrive au prochain jalon. Vos choix ci-dessus sont
        bien conservés.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
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
  },
  body: {
    fontSize: 16,
    color: '#333333',
    marginTop: 12,
  },
});
