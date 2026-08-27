import { useState } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { COLORS } from '@/theme/colors';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword &&
    !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const { requiresEmailConfirmation } = await signUp(
        email.trim(),
        password,
        displayName.trim(),
      );
      if (requiresEmailConfirmation) {
        setNeedsEmailConfirmation(true);
      }
      // Otherwise the session is already active: the root layout's
      // Stack.Protected guard switches to the (app) group automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (needsEmailConfirmation) {
    return (
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Vérifiez votre boîte mail</Text>
          <Text style={styles.subtitle}>
            Nous avons envoyé un lien de confirmation à {email.trim()}. Ouvrez-le pour activer
            votre compte, puis connectez-vous.
          </Text>
          <Link href="/sign-in" asChild>
            <Pressable style={[styles.button, styles.buttonLink]} accessibilityRole="button">
              <Text style={styles.buttonText}>Retour à la connexion</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Quelques informations pour commencer.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nom affiché</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            textContentType="name"
            placeholder="Mme Dupont"
            accessibilityLabel="Nom affiché"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="prenom.nom@ecole.fr"
            accessibilityLabel="Adresse e-mail"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            placeholder="6 caractères minimum"
            accessibilityLabel="Mot de passe"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            placeholder="••••••••"
            accessibilityLabel="Confirmer le mot de passe"
          />
          {confirmPassword.length > 0 && password !== confirmPassword ? (
            <Text style={styles.fieldError}>Les mots de passe ne correspondent pas.</Text>
          ) : null}
        </View>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Créer un compte</Text>
          )}
        </Pressable>

        <Link href="/sign-in" style={styles.link}>
          Déjà un compte ? Se connecter
        </Link>

        <Link href="/privacy" style={styles.privacyLink}>
          Politique de confidentialité
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  form: {
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 24,
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
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  fieldError: {
    color: '#B42318',
    fontSize: 13,
  },
  error: {
    color: '#B42318',
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
  buttonLink: {
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.primary,
    fontSize: 14,
  },
  privacyLink: {
    textAlign: 'center',
    marginTop: 12,
    color: '#98A2B3',
    fontSize: 13,
  },
});
