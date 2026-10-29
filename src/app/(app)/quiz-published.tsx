import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { HeroCard } from '@/components/HeroCard';
import { Tip } from '@/components/Tip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { buildPublicQuizUrl } from '@/features/quiz-publishing/publicQuizUrl';
import { copyText, shareText } from '@/features/quiz-sharing/shareOrCopy';
import { colors, gradients, radii, shadows, sizes, spacing, type } from '@/theme';

// The teacher's view of a published quiz: confirmation that it is live, the
// public URL to give to students, and the share / copy actions (Milestones 7
// & 10). Shown right after publishing, and also when a teacher taps a
// published quiz in "Mes devoirs".
export default function QuizPublishedScreen() {
  const { title, slug, quizId } = useLocalSearchParams<{
    title?: string;
    slug?: string;
    quizId?: string;
  }>();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const canGoBack = router.canGoBack();

  if (!slug) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <EmptyState
            variant="problem"
            icon="search-outline"
            title="Devoir introuvable"
            body="Ce devoir n’est plus disponible. Retournez à l’accueil et réessayez."
            action={{ label: 'Retour à l’accueil', onPress: () => router.replace('/') }}
          />
        </ScrollView>
      </Screen>
    );
  }

  const url = buildPublicQuizUrl(slug);

  async function handleCopy() {
    const ok = await copyText(url);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {canGoBack && <BackButton onPress={() => router.back()} />}

        <Tip
          id="quiz-published"
          text="Envoyez ce lien à vos élèves par WhatsApp, ÉcoleDirecte ou e-mail. Ils l’ouvrent dans leur navigateur, sans compte."
        />

        <HeroCard>
          <View style={styles.badge}>
            <Ionicons name="checkmark" size={14} color={colors.textOnBrand} />
            <Text style={styles.badgeText}>Devoir publié</Text>
          </View>
          <Text style={styles.heroTitle} accessibilityRole="header">
            {title || 'Le devoir'} est prêt
          </Text>
          <Text style={styles.heroBody}>
            Donnez ce lien à vos élèves : ils font le devoir sans compte ni installation.
          </Text>
        </HeroCard>

        <View style={styles.linkBox}>
          <Ionicons name="link-outline" size={18} color={colors.actionText} />
          <Text
            style={styles.linkText}
            selectable
            numberOfLines={1}
            accessibilityLabel="Lien du devoir à partager"
          >
            {url}
          </Text>
        </View>

        <View style={styles.shareRow}>
          <PrimaryButton
            label="Partager"
            icon="share-outline"
            onPress={() => shareText(url)}
            style={styles.shareButton}
          />
          {copyFeedback ? (
            // Same button, confirmed state: green with a check, never color
            // alone — the label also changes (CLAUDE.md §37).
            <Pressable
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel="Lien copié"
              style={[styles.shareButton, styles.copiedButton]}
            >
              <Ionicons name="checkmark" size={18} color={colors.success.text} />
              <Text style={styles.copiedText}>Lien copié</Text>
            </Pressable>
          ) : (
            <SecondaryButton
              label="Copier le lien"
              icon="copy-outline"
              onPress={handleCopy}
              style={styles.shareButton}
            />
          )}
        </View>

        {quizId && (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/quiz-results', params: { quizId, title: title || '' } })
            }
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <GlassCard style={styles.resultsRow}>
              <LinearGradient {...gradients.iconTile} style={styles.resultsIcon}>
                <Ionicons name="people-outline" size={22} color={colors.actionText} />
              </LinearGradient>
              <View style={styles.resultsText}>
                <Text style={styles.resultsTitle}>Voir les réponses des élèves</Text>
                <Text style={styles.resultsMeta}>Qui a répondu et avec quel score</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </GlassCard>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.homeLink, pressed && styles.pressed]}
        >
          <Text style={styles.homeLinkText}>Retour à l’accueil</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.onBrandBadge,
    borderWidth: 1,
    borderColor: colors.onBrandBadgeBorder,
  },
  badgeText: {
    ...type.metaStrong,
    color: colors.textOnBrand,
  },
  heroTitle: {
    ...type.heroTitle,
    color: colors.textOnBrand,
    marginTop: 14,
    marginBottom: spacing.sm,
  },
  heroBody: {
    ...type.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textOnBrandSoft,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: {
    ...type.bodyStrong,
    flex: 1,
    minWidth: 0,
    color: colors.info.text,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButton: {
    flex: 1,
    minHeight: sizes.primaryButton,
    paddingHorizontal: spacing.md,
  },
  copiedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.success.border,
    backgroundColor: colors.success.background,
  },
  copiedText: {
    ...type.buttonSecondary,
    color: colors.success.text,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 72,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.chip,
    boxShadow: shadows.card,
  },
  resultsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsText: {
    flex: 1,
    gap: 2,
  },
  resultsTitle: {
    ...type.bodyEmphasis,
    color: colors.text,
  },
  resultsMeta: {
    ...type.meta,
    color: colors.textSecondary,
  },
  homeLink: {
    alignSelf: 'center',
    minHeight: sizes.compactButton,
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  homeLinkText: {
    ...type.buttonSecondary,
    color: colors.actionText,
  },
});
