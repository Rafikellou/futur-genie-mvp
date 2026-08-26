import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { compressLessonImage, LessonImage } from '@/features/exercise-creation/lessonImage';
import { generateQuizFromLesson } from '@/features/exercise-creation/generateQuiz';
import { EXERCISE_TYPES, QuizType } from '@shared/domain/exercise';
import { GRADES, Grade } from '@shared/domain/grade';
import { SUBJECTS, Subject } from '@shared/domain/subject';
import {
  GENERATION_ERROR_MESSAGES,
  RETAKE_PHOTO_ERRORS,
} from '@shared/domain/generationErrors';

type PhotoSource = 'camera' | 'library';

// The backend returns a single final response (no live progress), so this
// just cycles through the CLAUDE.md-suggested copy on a timer rather than
// fabricating a real percentage (CLAUDE.md §38).
const GENERATION_STEP_LABELS = [
  'Lecture de la leçon…',
  'Création des questions…',
  'Préparation du devoir…',
];
const GENERATION_STEP_DURATION_MS = 3000;

function useGenerationStepLabel(active: boolean): string {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, GENERATION_STEP_LABELS.length - 1));
    }, GENERATION_STEP_DURATION_MS);
    return () => clearInterval(interval);
  }, [active]);

  return GENERATION_STEP_LABELS[stepIndex];
}

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

  const [photo, setPhoto] = useState<LessonImage | null>(null);
  const [busySource, setBusySource] = useState<PhotoSource | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationLabel = useGenerationStepLabel(isGenerating);

  async function handlePhotoSource(source: PhotoSource) {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showPermissionDeniedAlert(source, permission.canAskAgain);
      return;
    }

    setBusySource(source);
    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 1,
              allowsEditing: false,
            });

      if (result.canceled) return;

      const asset = result.assets[0];
      const compressed = await compressLessonImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      setPhoto(compressed);
    } catch {
      // Covers manipulation failures and unexpected picker errors alike —
      // the teacher only needs to know the photo didn't work, not why.
      Alert.alert(
        'Photo indisponible',
        "Nous n'avons pas pu utiliser cette photo. Réessayez avec une autre image."
      );
    } finally {
      setBusySource(null);
    }
  }

  async function handleContinue() {
    if (!photo || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await generateQuizFromLesson({
        photo,
        grade: grade as Grade,
        subject: subject as Subject,
        quizType: quizType as QuizType,
        questionCount: Number(questionCount),
      });

      if (!result.ok) {
        const canRetakePhoto = RETAKE_PHOTO_ERRORS.has(result.code);
        Alert.alert(
          'Devoir non créé',
          GENERATION_ERROR_MESSAGES[result.code],
          canRetakePhoto
            ? [
                { text: 'Réessayer', style: 'cancel' },
                { text: 'Reprendre la photo', onPress: () => setPhoto(null) },
              ]
            : [{ text: 'Réessayer' }]
        );
        return;
      }

      router.push({
        pathname: '/quiz-draft',
        params: { quiz: JSON.stringify(result.quiz) },
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const isBusy = busySource !== null || isGenerating;

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

        <Text style={styles.title}>Photo de la leçon</Text>
        <Text style={styles.subtitle}>
          {gradeLabel} · {subjectLabel} · {quizTypeLabel} · {questionCount} questions
        </Text>

        {photo ? (
          <>
            <Image
              source={{ uri: photo.uri }}
              style={[styles.preview, { aspectRatio: photo.width / photo.height }]}
              resizeMode="contain"
              accessibilityLabel="Photo de la leçon sélectionnée"
            />
            <View style={styles.row}>
              <PhotoButton
                label="Reprendre"
                onPress={() => handlePhotoSource('camera')}
                loading={busySource === 'camera'}
                disabled={isBusy}
              />
              <PhotoButton
                label="Choisir une autre photo"
                onPress={() => handlePhotoSource('library')}
                loading={busySource === 'library'}
                disabled={isBusy}
              />
            </View>
            <Pressable
              style={[styles.button, isGenerating && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={isGenerating}
              accessibilityRole="button"
              accessibilityLabel={isGenerating ? generationLabel : 'Continuer'}
            >
              {isGenerating ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.buttonText}>{generationLabel}</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Continuer</Text>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.chooserColumn}>
            <Text style={styles.body}>
              Cadrez toute la leçon, avec un bon éclairage et un texte lisible.
            </Text>
            <PhotoButton
              label="Prendre une photo"
              onPress={() => handlePhotoSource('camera')}
              loading={busySource === 'camera'}
              disabled={isBusy}
              primary
            />
            <PhotoButton
              label="Choisir dans la bibliothèque"
              onPress={() => handlePhotoSource('library')}
              loading={busySource === 'library'}
              disabled={isBusy}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function showPermissionDeniedAlert(source: PhotoSource, canAskAgain: boolean) {
  const target = source === 'camera' ? "à l'appareil photo" : 'à vos photos';

  if (canAskAgain) {
    Alert.alert('Autorisation nécessaire', `Autorisez l'accès ${target} pour continuer.`);
    return;
  }

  // On iOS/Android, once denied the OS won't show its permission dialog
  // again — the only way forward is the app's settings page.
  Alert.alert(
    'Autorisation nécessaire',
    `L'accès ${target} est désactivé pour Futur Génie. Autorisez-le dans les réglages de votre appareil pour continuer.`,
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
    ]
  );
}

type PhotoButtonProps = {
  label: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  primary?: boolean;
};

// Local to this screen: the four camera/library triggers share this look,
// but nothing outside create-photo needs it yet (CLAUDE.md §59).
function PhotoButton({ label, onPress, loading, disabled, primary = false }: PhotoButtonProps) {
  return (
    <Pressable
      style={[styles.button, !primary && styles.buttonSecondary, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={primary ? '#FFFFFF' : '#208AEF'} />
      ) : (
        <Text style={[styles.buttonText, !primary && styles.buttonTextSecondary]}>{label}</Text>
      )}
    </Pressable>
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
    marginBottom: 20,
  },
  body: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 4,
  },
  chooserColumn: {
    gap: 14,
    marginTop: 12,
  },
  preview: {
    width: '100%',
    maxHeight: 420,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#208AEF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#208AEF',
  },
});
