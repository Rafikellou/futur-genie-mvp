import { useState } from 'react';
import { Link } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { Banner } from '@/components/Banner';
import { GlassCard } from '@/components/GlassCard';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, fonts, shadows, spacing, type } from '@/theme';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // No manual navigation needed: once the session updates, the root
      // layout's Stack.Protected guard switches to the (app) group.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo size={76} showWordmark={false} />
          <Text style={styles.title} accessibilityRole="header">
            Futur Génie
          </Text>
          <Text style={styles.subtitle}>Créez un devoir à partir d’une photo de leçon.</Text>

          <GlassCard style={styles.formCard}>
            <TextField
              label="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="prenom.nom@ecole.fr"
            />
            <TextField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              placeholder="••••••••"
            />
            <Link href={{ pathname: '/forgot-password', params: { email: email.trim() } }} asChild>
              <Pressable accessibilityRole="link" hitSlop={8} style={styles.forgotLink}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </Pressable>
            </Link>

            {error ? <Banner tone="error" messages={error} /> : null}

            <PrimaryButton
              label="Se connecter"
              onPress={handleSubmit}
              disabled={!canSubmit && !isSubmitting}
              loading={isSubmitting}
            />
          </GlassCard>

          <Link href="/sign-up" asChild>
            <Pressable accessibilityRole="link" hitSlop={12} style={styles.footerLink}>
              <Text style={styles.footerText}>
                Pas encore de compte ? <Text style={styles.linkText}>Créer un compte</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: 48,
    paddingBottom: 40,
  },
  title: {
    ...type.display,
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  formCard: {
    alignSelf: 'stretch',
    padding: 22,
    gap: spacing.lg,
    borderRadius: 28,
    boxShadow: shadows.form,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.link,
  },
  footerLink: {
    marginTop: spacing.xxl,
  },
  footerText: {
    ...type.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  linkText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.link,
  },
});
