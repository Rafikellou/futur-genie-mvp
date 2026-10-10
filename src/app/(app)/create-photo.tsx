import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { QuizRecapPills } from '@/components/Pill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StepBar, StepLabel } from '@/components/StepIndicator';
import { GenerationProgress } from '@/features/exercise-creation/components/GenerationProgress';
import { compressLessonImage, LessonImage } from '@/features/exercise-creation/lessonImage';
import { generateQuizFromLesson } from '@/features/exercise-creation/generateQuiz';
import { EXERCISE_TYPES, QuizType } from '@shared/domain/exercise';
import { GRADES, Grade } from '@shared/domain/grade';
import { SUBJECTS, Subject } from '@shared/domain/subject';
import {
  GENERATION_ERROR_MESSAGES,
  RETAKE_PHOTO_ERRORS,
} from '@shared/domain/generationErrors';
import { colors, gradients, radii, shadows, sizes, spacing, type } from '@/theme';

type PhotoSource = 'camera' | 'library';

// The backend returns a single final response (no live progress), so this
// just cycles through the CLAUDE.md-suggested copy on a timer rather than
// fabricating a real percentage (CLAUDE.md §38).
const GENERATION_STEP_LABELS = [
  'Lecture de la leçon',
  'Création des questions',
  'Préparation du devoir',
];
const GENERATION_STEP_DURATION_MS = 3000;

function useGenerationStep(active: boolean): number {
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

  return stepIndex;
}

const PHOTO_TIPS = ['Cadrez toute la leçon', 'Un bon éclairage, sans reflet', 'Un texte bien lisible'];

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
  const generationStep = useGenerationStep(isGenerating);

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
        params: {
          quiz: JSON.stringify(result.quiz),
          ...(result.lessonMode ? { lessonMode: result.lessonMode } : {}),
        },
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const isBusy = busySource !== null || isGenerating;

  // Full-screen progress replaces the photo screen while the devoir is being
  // created; the photo stays in state, so an error brings the teacher back
  // to the preview with it intact.
  if (isGenerating) {
    return (
      <Screen>
        <GenerationProgress steps={GENERATION_STEP_LABELS} currentStep={generationStep} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <BackButton onPress={() => router.back()} />
          <StepLabel step={2} />
        </View>
        {!photo && <StepBar step={2} />}

        <Text style={styles.title} accessibilityRole="header">
          Photo de la leçon
        </Text>

        {photo ? (
          <>
            <Text style={styles.subtitle}>
              {gradeLabel} · {subjectLabel} · {quizTypeLabel} · {questionCount} questions
            </Text>
            <View style={styles.previewFrame}>
              <Image
                source={{ uri: photo.uri }}
                style={[styles.preview, { aspectRatio: photo.width / photo.height }]}
                resizeMode="contain"
                accessibilityLabel="Photo de la leçon sélectionnée"
              />
            </View>
            <View style={styles.row}>
              <SecondaryButton
                label="Reprendre"
                icon="camera-outline"
                onPress={() => handlePhotoSource('camera')}
                loading={busySource === 'camera'}
                disabled={isBusy}
                accessibilityLabel="Reprendre la photo"
                style={styles.compactButton}
              />
              <SecondaryButton
                label="Autre photo"
                icon="image-outline"
                onPress={() => handlePhotoSource('library')}
                loading={busySource === 'library'}
                disabled={isBusy}
                accessibilityLabel="Choisir une autre photo"
                style={styles.compactButton}
              />
            </View>
            <PrimaryButton
              label="Créer le devoir"
              icon="sparkles-outline"
              onPress={handleContinue}
              disabled={isBusy}
            />
          </>
        ) : (
          <>
            <QuizRecapPills
              labels={[gradeLabel, subjectLabel, quizTypeLabel, `${questionCount} questions`]}
            />
            <FramingIllustration />
            <View style={styles.tips}>
              {PHOTO_TIPS.map((tip) => (
                <View key={tip} style={styles.tip}>
                  <View style={styles.tipIcon}>
                    <Ionicons name="checkmark" size={14} color={colors.actionText} />
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chooserColumn}>
              <PrimaryButton
                label="Prendre une photo"
                icon="camera-outline"
                onPress={() => handlePhotoSource('camera')}
                loading={busySource === 'camera'}
                disabled={isBusy}
              />
              <SecondaryButton
                label="Choisir dans la bibliothèque"
                icon="image-outline"
                onPress={() => handlePhotoSource('library')}
                loading={busySource === 'library'}
                disabled={isBusy}
                style={styles.libraryButton}
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// Decorative sketch of a lesson page inside framing corners — shows what a
// good photo looks like before the camera opens.
function FramingIllustration() {
  return (
    <GlassCard style={styles.illustration}>
      <View
        style={styles.sheet}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <LinearGradient {...gradients.selected} style={[styles.sheetLine, styles.sheetHeading]} />
        <View style={styles.sheetLine} />
        <View style={styles.sheetLine} />
        <View style={[styles.sheetLine, styles.sheetLine80]} />
        <View style={styles.sheetBlock} />
        <View style={styles.sheetLine} />
        <View style={[styles.sheetLine, styles.sheetLine60]} />
      </View>
      <View style={[styles.corner, styles.cornerTopLeft]} />
      <View style={[styles.corner, styles.cornerTopRight]} />
      <View style={[styles.corner, styles.cornerBottomLeft]} />
      <View style={[styles.corner, styles.cornerBottomRight]} />
    </GlassCard>
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

// Framing corners sit 90 px in from the sides and 22 px from the top/bottom
// of the 250 px illustration card, around the 150 × 190 sheet.
const CORNER_INSET_X = 90;
const CORNER_INSET_Y = 22;

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
  title: {
    ...type.title,
    color: colors.text,
  },
  subtitle: {
    ...type.label,
    fontFamily: type.body.fontFamily,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  illustration: {
    height: 250,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: 150,
    height: 190,
    borderRadius: 10,
    backgroundColor: colors.surface,
    boxShadow: shadows.sheet,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 9,
  },
  sheetLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  sheetLine80: {
    width: '80%',
  },
  sheetLine60: {
    width: '60%',
  },
  sheetHeading: {
    height: 10,
    width: '70%',
    borderRadius: 5,
  },
  sheetBlock: {
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.tint.pink.background,
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: colors.brandRaspberry,
  },
  cornerTopLeft: {
    left: CORNER_INSET_X,
    top: CORNER_INSET_Y,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    right: CORNER_INSET_X,
    top: CORNER_INSET_Y,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    left: CORNER_INSET_X,
    bottom: CORNER_INSET_Y,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    right: CORNER_INSET_X,
    bottom: CORNER_INSET_Y,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 8,
  },
  tips: {
    gap: spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint.blue.background,
  },
  tipText: {
    ...type.label,
    fontFamily: type.body.fontFamily,
    color: colors.textBody,
  },
  chooserColumn: {
    gap: 10,
    marginTop: spacing.xs,
  },
  libraryButton: {
    minHeight: 54,
  },
  previewFrame: {
    padding: 10,
    borderRadius: 26,
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
    boxShadow: shadows.photo,
  },
  preview: {
    width: '100%',
    maxHeight: 360,
    borderRadius: 18,
    backgroundColor: colors.track,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  compactButton: {
    flex: 1,
    minHeight: sizes.compactButton,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
  },
});
