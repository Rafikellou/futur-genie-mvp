import { useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { TeacherDetailsForm } from '@/features/auth/TeacherDetailsForm';
import { COLORS } from '@/theme/colors';

export default function ProfileScreen() {
  const { session, profile, updateTeacherDetails, signOut, deleteAccount } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      // No manual navigation needed: the root layout's Stack.Protected
      // guard switches to the (auth) group once the session clears.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setIsSigningOut(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer votre compte ?',
      'Tous vos devoirs et les réponses de vos élèves seront définitivement supprimés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            setError(null);
            try {
              await deleteAccount();
              // No manual navigation needed: the root layout's Stack.Protected
              // guard switches to the (auth) group once the session clears.
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Mon profil</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <Text style={styles.readOnlyValue}>{session?.user.email}</Text>
        </View>

        <TeacherDetailsForm
          initial={{
            title: profile?.title ?? undefined,
            firstName: profile?.firstName ?? undefined,
            lastName: profile?.lastName ?? undefined,
            schoolName: profile?.schoolName ?? undefined,
            schoolPostalCode: profile?.schoolPostalCode ?? undefined,
            classGrade: profile?.classGrade ?? undefined,
          }}
          submitLabel="Enregistrer"
          successMessage="Profil mis à jour."
          onSubmit={updateTeacherDetails}
        />

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
          disabled={isSigningOut}
          accessibilityRole="button"
        >
          {isSigningOut ? (
            <ActivityIndicator color="#B42318" />
          ) : (
            <Text style={styles.signOutButtonText}>Se déconnecter</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          accessibilityRole="button"
        >
          {isDeleting ? (
            <ActivityIndicator color="#B42318" />
          ) : (
            <Text style={styles.deleteAccountButtonText}>Supprimer mon compte</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/privacy')} accessibilityRole="link">
          <Text style={styles.privacyLink}>Politique de confidentialité</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  field: {
    gap: 6,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  readOnlyValue: {
    fontSize: 16,
    color: '#555555',
    paddingVertical: 12,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B42318',
    marginTop: 24,
  },
  signOutButtonText: {
    color: '#B42318',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },
  deleteAccountButtonText: {
    color: '#98A2B3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  privacyLink: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});
