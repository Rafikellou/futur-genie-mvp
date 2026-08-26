import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { COLORS } from '@/theme/colors';

export default function ProfileScreen() {
  const { session, profile, updateDisplayName, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  const hasChanges = displayName.trim() !== (profile?.displayName ?? '') && displayName.trim().length > 0;

  async function handleSave() {
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await updateDisplayName(displayName.trim());
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSaving(false);
    }
  }

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

  return (
    <Screen style={styles.container}>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.back}>‹ Retour</Text>
      </Pressable>

      <Text style={styles.title}>Mon profil</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <Text style={styles.readOnlyValue}>{session?.user.email}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nom affiché</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={(value) => {
            setDisplayName(value);
            setSaved(false);
          }}
          placeholder="Mme Dupont"
          accessibilityLabel="Nom affiché"
        />
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {saved ? <Text style={styles.success}>Profil mis à jour.</Text> : null}

      <Pressable
        style={[styles.button, !hasChanges && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!hasChanges || isSaving}
        accessibilityRole="button"
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Enregistrer</Text>
        )}
      </Pressable>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  back: {
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  field: {
    gap: 6,
    marginBottom: 12,
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
  },
  success: {
    color: '#067647',
    fontSize: 14,
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
});
