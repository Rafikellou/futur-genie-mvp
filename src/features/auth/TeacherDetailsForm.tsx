import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { OptionChips } from '@/features/exercise-creation/components/OptionChips';
import { colors, spacing, type } from '@/theme';
import { GRADES, Grade } from '@shared/domain/grade';
import { TEACHER_TITLES, TeacherTitle } from '@shared/domain/title';
import { SCHOOL_NAME_MAX_LENGTH, type TeacherDetails } from '@shared/domain/profile';

type Props = {
  initial?: Partial<TeacherDetails>;
  submitLabel: string;
  onSubmit: (details: TeacherDetails) => Promise<void>;
  // Shown briefly under the button after a successful save (Profil tab).
  successMessage?: string;
  // First and last name side by side (Profil) instead of stacked (onboarding).
  compactNames?: boolean;
};

// Shared by the mandatory onboarding screen and the Profil tab: the same six
// fields, the same validation. Kept as one component so the two entry points
// can never drift apart (CLAUDE.md §46, §57).
export function TeacherDetailsForm({
  initial,
  submitLabel,
  onSubmit,
  successMessage,
  compactNames = false,
}: Props) {
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

      <View style={compactNames ? styles.nameRow : styles.nameColumn}>
        <TextField
          label="Prénom"
          value={firstName}
          onChangeText={(value) => {
            setFirstName(value);
            markDirty();
          }}
          placeholder="Camille"
          style={compactNames ? styles.nameField : undefined}
        />
        <TextField
          label="Nom"
          value={lastName}
          onChangeText={(value) => {
            setLastName(value);
            markDirty();
          }}
          placeholder="Dupont"
          style={compactNames ? styles.nameField : undefined}
        />
      </View>

      <TextField
        label="Nom de l’école"
        value={schoolName}
        onChangeText={(value) => {
          setSchoolName(value);
          markDirty();
        }}
        placeholder="École Jean Jaurès"
        maxLength={SCHOOL_NAME_MAX_LENGTH}
      />

      <TextField
        label="Code postal de l’école"
        value={postalCode}
        onChangeText={(value) => {
          setPostalCode(value.replace(/[^0-9]/g, '').slice(0, 5));
          markDirty();
        }}
        placeholder="75011"
        keyboardType="number-pad"
        maxLength={5}
        inputStyle={styles.postalCode}
      />

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

      {error ? <Banner tone="error" messages={error} /> : null}
      {saved && successMessage ? <Banner tone="success" messages={successMessage} /> : null}

      <PrimaryButton
        label={submitLabel}
        onPress={handleSubmit}
        disabled={!canSubmit && !isSaving}
        loading={isSaving}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  field: {
    gap: 10,
  },
  label: {
    ...type.labelStrong,
    color: colors.text,
  },
  nameColumn: {
    gap: 18,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameField: {
    flex: 1,
  },
  postalCode: {
    width: 140,
  },
  submit: {
    marginTop: spacing.xs,
  },
});
