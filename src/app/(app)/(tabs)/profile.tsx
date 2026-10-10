import { useState, type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
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
import { HeroCard } from '@/components/HeroCard';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { useAuth } from '@/features/auth/AuthProvider';
import { TeacherDetailsForm } from '@/features/auth/TeacherDetailsForm';
import { colors, fonts, radii, shadows, sizes, spacing, type } from '@/theme';

export default function ProfileScreen() {
  const { session, profile, updateTeacherDetails, signOut, deleteAccount } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tabBarSpace = useTabBarSpace();

  const fullName = [profile?.title, profile?.firstName, profile?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const initials = `${profile?.firstName?.trim().charAt(0) ?? ''}${
    profile?.lastName?.trim().charAt(0) ?? ''
  }`.toUpperCase();

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
        { text: 'Annuler' },
      ],
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title} accessibilityRole="header">
            Mon profil
          </Text>

          <HeroCard contentStyle={styles.identity}>
            <View style={styles.avatar}>
              {initials ? (
                <Text style={styles.avatarText}>{initials}</Text>
              ) : (
                <Ionicons name="person-outline" size={24} color={colors.textOnBrand} />
              )}
            </View>
            <View style={styles.identityText}>
              {fullName ? <Text style={styles.name}>{fullName}</Text> : null}
              <Text style={styles.email} accessibilityLabel={`Adresse e-mail : ${session?.user.email ?? ''}`}>
                {session?.user.email}
              </Text>
            </View>
          </HeroCard>

          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Mes informations
            </Text>
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
              compactNames
            />
          </GlassCard>

          {error ? <Banner tone="error" messages={error} /> : null}

          <GlassCard style={styles.actions}>
            <ActionRow
              icon="shield-checkmark-outline"
              label="Politique de confidentialité"
              onPress={() => router.push('/privacy')}
              role="link"
              showChevron
            />
            <ActionRow
              icon="log-out-outline"
              label="Se déconnecter"
              onPress={handleSignOut}
              loading={isSigningOut}
            />
            <ActionRow
              icon="trash-outline"
              label="Supprimer mon compte"
              onPress={handleDeleteAccount}
              loading={isDeleting}
              destructive
              last
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  role = 'button',
  loading = false,
  destructive = false,
  showChevron = false,
  last = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  role?: 'button' | 'link';
  loading?: boolean;
  destructive?: boolean;
  showChevron?: boolean;
  last?: boolean;
}) {
  const tint = destructive ? colors.danger.text : colors.actionText;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole={role}
      accessibilityState={{ busy: loading }}
      style={({ pressed }) => [styles.actionRow, !last && styles.actionDivider, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={[styles.actionLabel, destructive && styles.actionLabelDestructive]}>{label}</Text>
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: 18,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 26,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onBrandBadge,
    borderWidth: 1,
    borderColor: colors.onBrandAvatarBorder,
  },
  avatarText: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textOnBrand,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textOnBrand,
  },
  email: {
    ...type.label,
    fontFamily: fonts.body,
    color: colors.textOnBrandSoft,
  },
  formCard: {
    padding: spacing.xl,
    gap: 18,
    borderRadius: 26,
    boxShadow: shadows.panel,
  },
  sectionTitle: {
    ...type.sectionTitle,
    fontSize: 17,
    color: colors.text,
  },
  actions: {
    borderRadius: radii.chip,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.secondaryButton,
    paddingHorizontal: spacing.lg,
  },
  actionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.trackSoft,
  },
  actionLabel: {
    ...type.label,
    fontSize: 15,
    flex: 1,
    color: colors.text,
  },
  actionLabelDestructive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.danger.text,
  },
});
