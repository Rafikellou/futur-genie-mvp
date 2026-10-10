import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Banner } from '@/components/Banner';
import { GlassCard } from '@/components/GlassCard';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, fonts, gradients, radii, shadows, spacing, type } from '@/theme';

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
      <Screen>
        <View style={styles.confirmation}>
          <View>
            <LinearGradient {...gradients.hero} style={styles.mailTile}>
              <Ionicons name="mail-outline" size={52} color={colors.textOnBrand} />
            </LinearGradient>
            <View style={styles.mailBadge}>
              <Ionicons name="checkmark" size={18} color={colors.brandRaspberry} />
            </View>
          </View>
          <Text style={styles.confirmationTitle} accessibilityRole="header">
            Vérifiez votre boîte mail
          </Text>
          <Text style={styles.confirmationBody}>
            Nous avons envoyé un lien de confirmation à{' '}
            <Text style={styles.confirmationEmail}>{email.trim()}</Text>. Ouvrez-le pour activer
            votre compte, puis connectez-vous.
          </Text>
          <PrimaryButton
            label="Retour à la connexion"
            onPress={() => router.push('/sign-in')}
            style={styles.confirmationButton}
          />
        </View>
      </Screen>
    );
  }

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={44} showWordmark={false} />
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                Créer un compte
              </Text>
              <Text style={styles.subtitle}>Quelques informations pour commencer.</Text>
            </View>
          </View>

          <GlassCard style={styles.formCard}>
            <TextField
              label="Nom affiché"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              textContentType="name"
              placeholder="Mme Dupont"
            />
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
              autoComplete="password-new"
              textContentType="newPassword"
              placeholder="6 caractères minimum"
            />
            <TextField
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              placeholder="••••••••"
              error={passwordsMismatch ? 'Les mots de passe ne correspondent pas.' : null}
            />

            {error ? <Banner tone="error" messages={error} /> : null}

            <PrimaryButton
              label="Créer un compte"
              onPress={handleSubmit}
              disabled={!canSubmit && !isSubmitting}
              loading={isSubmitting}
            />
          </GlassCard>

          <View style={styles.footer}>
            <Link href="/sign-in" asChild>
              <Pressable accessibilityRole="link" hitSlop={12}>
                <Text style={styles.footerText}>
                  Déjà un compte ? <Text style={styles.linkText}>Se connecter</Text>
                </Text>
              </Pressable>
            </Link>
            <Link href="/privacy" asChild>
              <Pressable accessibilityRole="link" hitSlop={12}>
                <Text style={styles.privacyText}>Politique de confidentialité</Text>
              </Pressable>
            </Link>
          </View>
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
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...type.heroTitle,
    color: colors.text,
  },
  subtitle: {
    ...type.body,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    padding: 22,
    gap: 14,
    borderRadius: 28,
    boxShadow: shadows.form,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
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
  privacyText: {
    ...type.label,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  confirmation: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 28,
  },
  mailTile: {
    width: 112,
    height: 112,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.brandTile,
  },
  mailBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    boxShadow: shadows.floatingBadge,
  },
  confirmationTitle: {
    ...type.title,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  confirmationBody: {
    ...type.body,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confirmationEmail: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  confirmationButton: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
