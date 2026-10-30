import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BackButton } from '@/components/BackButton';
import { Banner } from '@/components/Banner';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, fonts, shadows, spacing, type } from '@/theme';

type Step = 'email' | 'code';

// Supabase's email OTP length is a project setting (6 by default, up to 10),
// so any length in that range is accepted rather than hard-coding 6.
const CODE_PATTERN = /^[0-9]{6,10}$/;

export default function ForgotPasswordScreen() {
  const { requestPasswordReset, resetPasswordWithCode } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedEmail = email.trim();
  const canRequest = trimmedEmail.length > 0 && !isSubmitting;
  const canReset =
    CODE_PATTERN.test(code.trim()) &&
    password.length >= 6 &&
    password === confirmPassword &&
    !isSubmitting;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function sendCode(isResend: boolean) {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setStep('code');
      if (isResend) setNotice('Un nouveau code vient de vous être envoyé.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset() {
    if (!canReset) return;
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await resetPasswordWithCode(trimmedEmail, code.trim(), password);
      // Signed in: the root layout's Stack.Protected guard switches to the
      // (app) group on its own.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setIsSubmitting(false);
    }
  }

  function goBack() {
    if (step === 'code') {
      setStep('email');
      setCode('');
      setError(null);
      setNotice(null);
    } else {
      router.back();
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackButton onPress={goBack} />

          <View>
            <Text style={styles.title} accessibilityRole="header">
              {step === 'email' ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email' ? (
                'Indiquez votre adresse e-mail : nous vous enverrons un code pour choisir un nouveau mot de passe.'
              ) : (
                <>
                  Si un compte existe pour <Text style={styles.emphasis}>{trimmedEmail}</Text>, un
                  code vient d’y être envoyé. Saisissez-le puis choisissez votre nouveau mot de passe.
                </>
              )}
            </Text>
          </View>

          <GlassCard style={styles.formCard}>
            {step === 'email' ? (
              <TextField
                label="Adresse e-mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="prenom.nom@ecole.fr"
                autoFocus={!params.email}
              />
            ) : (
              <>
                <TextField
                  label="Code reçu par e-mail"
                  value={code}
                  onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={10}
                  placeholder="123456"
                  autoFocus
                />
                <TextField
                  label="Nouveau mot de passe"
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
              </>
            )}

            {notice ? <Banner tone="success" messages={notice} /> : null}
            {error ? <Banner tone="error" messages={error} /> : null}

            {step === 'email' ? (
              <PrimaryButton
                label="Recevoir un code"
                onPress={() => canRequest && sendCode(false)}
                disabled={!canRequest && !isSubmitting}
                loading={isSubmitting}
              />
            ) : (
              <PrimaryButton
                label="Enregistrer le mot de passe"
                onPress={handleReset}
                disabled={!canReset && !isSubmitting}
                loading={isSubmitting}
              />
            )}
          </GlassCard>

          {step === 'code' ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              disabled={isSubmitting}
              onPress={() => sendCode(true)}
              style={styles.footerLink}
            >
              <Text style={styles.footerText}>
                Pas reçu de code ? <Text style={styles.linkText}>Renvoyer le code</Text>
              </Text>
            </Pressable>
          ) : null}
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
  title: {
    ...type.heroTitle,
    color: colors.text,
  },
  subtitle: {
    ...type.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emphasis: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  formCard: {
    padding: 22,
    gap: 14,
    borderRadius: 28,
    boxShadow: shadows.form,
  },
  footerLink: {
    alignSelf: 'center',
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
