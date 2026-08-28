import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { OptionChips } from '@/features/exercise-creation/components/OptionChips';
import { COLORS } from '@/theme/colors';
import { GRADES, Grade } from '@shared/domain/grade';
import { TEACHER_TITLES, TeacherTitle } from '@shared/domain/title';
import type { TeacherDetails } from '@shared/domain/profile';

type Props = {
  initial?: Partial<TeacherDetails>;
  submitLabel: string;
  onSubmit: (details: TeacherDetails) => Promise<void>;
  // Shown briefly under the button after a successful save (Profil tab).
  successMessage?: string;
};

// Shared by the mandatory onboarding screen and the Profil tab: the same six
// fields, the same validation. Kept as one component so the two entry points
// can never drift apart (CLAUDE.md §46, §57).
export function TeacherDetailsForm({ initial, submitLabel, onSubmit, successMessage }: Props) {
  const [title, setTitle] = useState<TeacherTitle | null>(initial?.title ?? null);
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [schoolName, setSchoolName] = useState(initial?.schoolName ?? '');
  const [postalCode, setPostalCode] = useState(initial?.schoolPostalCode ?? '');
  const [classGrade, setClassGrade] = useState<Grade | null>(initial?.classGrade ?? null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const postalCodeValid = /^[0-9]{5}$/.test(postalCode.trim());
  const canSubmit =
    Boolean(title) &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    schoolName.trim().length > 0 &&
    postalCodeValid &&
    Boolean(classGrade) &&
    !isSaving;

  async function handleSubmit() {
    if (!title || !classGrade || !canSubmit) return;
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await onSubmit({
        title,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        schoolName: schoolName.trim(),
        schoolPostalCode: postalCode.trim(),
        classGrade,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSaving(false);
    }
  }

  function markDirty() {
    setSaved(false);
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>Civilité</Text>
        <OptionChips
          options={TEACHER_TITLES}
          selected={title}
          onSelect={(value) => {
            setTitle(value);
            markDirty();
          }}
          accessibilityLabelPrefix="Civilité"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={(value) => {
            setFirstName(value);
            markDirty();
          }}
          placeholder="Camille"
          accessibilityLabel="Prénom"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={(value) => {
            setLastName(value);
            markDirty();
          }}
          placeholder="Dupont"
          accessibilityLabel="Nom"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nom de l&apos;école</Text>
        <TextInput
          style={styles.input}
          value={schoolName}
          onChangeText={(value) => {
            setSchoolName(value);
            markDirty();
          }}
          placeholder="École élémentaire Jean Jaurès"
          accessibilityLabel="Nom de l'école"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Code postal de l&apos;école</Text>
        <TextInput
          style={styles.input}
          value={postalCode}
          onChangeText={(value) => {
            setPostalCode(value.replace(/[^0-9]/g, '').slice(0, 5));
            markDirty();
          }}
          placeholder="75011"
          keyboardType="number-pad"
          maxLength={5}
          accessibilityLabel="Code postal de l'école"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Niveau de votre classe</Text>
        <OptionChips
          options={GRADES}
          selected={classGrade}
          onSelect={(value) => {
            setClassGrade(value);
            markDirty();
          }}
          accessibilityLabelPrefix="Niveau"
        />
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {saved && successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityRole="button"
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 4,
  },
  field: {
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    marginBottom: 8,
  },
  success: {
    color: '#067647',
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
