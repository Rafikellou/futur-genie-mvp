import { useCallback, useState, type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@shared/supabase/client';
import { GRADES } from '@shared/domain/grade';
import { SUBJECTS, type Subject } from '@shared/domain/subject';
import { GlassCard } from '@/components/GlassCard';
import { HeroCard } from '@/components/HeroCard';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useTabBarSpace } from '@/components/TabBar';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, fonts, gradients, radii, shadows, sizes, spacing, type } from '@/theme';

type RecentQuiz = {
  id: string;
  title: string;
  subject: Subject;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string | null;
  public_slug: string | null;
};

type HomeState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; total: number; recent: RecentQuiz[] };

const RECENT_COUNT = 3;

// Purely decorative "at a glance" content — not a features dashboard
// (CLAUDE.md §6 excludes complex analytics). One query against the teacher's
// own RLS-scoped rows returns both the total count and the 3 most recent
// quizzes. Failure just hides that content instead of blocking the home
// screen, since it's not on the golden path.
//
// Reloaded each time the tab regains focus, so a devoir published a moment
// ago shows up when the teacher comes back home. A failed reload keeps the
// last good data rather than making the sections disappear.
//
// Only "created" is counted, not "published": drafting and publishing happen
// as one action (see quiz-draft.tsx's handlePublish), so every row in
// `quizzes` is published in practice.
function useHomeData(teacherId: string | undefined): HomeState {
  const [state, setState] = useState<HomeState>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      if (!teacherId) return;
      let cancelled = false;

      supabase
        .from('quizzes')
        .select('id, title, subject, status, created_at, published_at, public_slug', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })
        .limit(RECENT_COUNT)
        .then(({ data, count, error }) => {
          if (cancelled) return;
          if (error || !data || count == null) {
            setState((prev) => (prev.status === 'ready' ? prev : { status: 'error' }));
            return;
          }
          setState({ status: 'ready', total: count, recent: data as RecentQuiz[] });
        });

      return () => {
        cancelled = true;
      };
    }, [teacherId]),
  );

  return state;
}

const SUBJECT_ICONS: Record<Subject, ComponentProps<typeof Ionicons>['name']> = {
  francais: 'book-outline',
  mathematiques: 'calculator-outline',
  histoire: 'time-outline',
  geographie: 'earth-outline',
  sciences: 'flask-outline',
  anglais: 'language-outline',
  autre: 'document-text-outline',
};

type IconName = ComponentProps<typeof Ionicons>['name'];

// First-launch home (docs/design AccueilPremierDevoir.dc.html): the golden
// path in four steps, shown until the teacher has created a first quiz.
const FIRST_QUIZ_STEPS: { label: string; icon: IconName; tint: keyof typeof colors.tint }[] = [
  { label: 'Photographiez la leçon', icon: 'camera-outline', tint: 'blue' },
  { label: 'Vérifiez les questions', icon: 'checkmark-done-outline', tint: 'violet' },
  { label: 'Partagez le lien aux élèves', icon: 'share-outline', tint: 'pink' },
  { label: 'Suivez leurs réponses', icon: 'people-outline', tint: 'orange' },
];

function formatToday(): string {
  const formatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function initialsOf(firstName: string | null | undefined, lastName: string | null | undefined) {
  return `${firstName?.trim().charAt(0) ?? ''}${lastName?.trim().charAt(0) ?? ''}`.toUpperCase();
}

export default function HomeScreen() {
  const { profile, session } = useAuth();
  const greetingName = profile?.displayName?.trim() || 'enseignant·e';
  const initials = initialsOf(profile?.firstName, profile?.lastName);
  const schoolName = profile?.schoolName?.trim();
  const classLabel = GRADES.find((g) => g.value === profile?.classGrade)?.label;
  const home = useHomeData(session?.user.id);
  const tabBarSpace = useTabBarSpace();
  // Same count query as the stat pill: zero quizzes means a brand-new
  // teacher. While loading (or if the count fails) the usual home shows.
  const isFirstQuiz = home.status === 'ready' && home.total === 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* The teacher's school, not the product name, heads the screen so
              the app reads as "their school's app"; Futur Génie stays as a
              byline. Falls back to the plain logo if the name is missing. */}
          {schoolName ? (
            <View style={styles.brand}>
              <Logo size={40} showWordmark={false} />
              <View style={styles.brandText}>
                <Text
                  style={styles.schoolName}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  accessibilityRole="header"
                >
                  {schoolName}
                </Text>
                <Text style={styles.byline}>avec Futur Génie</Text>
              </View>
            </View>
          ) : (
            <Logo size={40} />
          )}
          <Pressable
            onPress={() => router.navigate('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profil"
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            {initials ? (
              <Text style={styles.avatarText}>{initials}</Text>
            ) : (
              <Ionicons name="person-outline" size={20} color={colors.actionText} />
            )}
          </Pressable>
        </View>

        {isFirstQuiz ? (
          <FirstQuizHome greetingName={greetingName} />
        ) : (
          <>
            <HeroCard>
              <Text style={styles.date}>{formatToday()}</Text>
              <Text style={styles.greeting}>
                Bonjour{'\n'}
                {greetingName}
              </Text>

              {home.status === 'ready' && home.total > 0 && (
                // Hidden for a brand-new teacher with zero quizzes yet — "0
                // devoirs créés" on a first visit reads as empty, not encouraging.
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{home.total}</Text>
                  <View>
                    <Text style={styles.statLabel}>
                      {home.total > 1 ? 'devoirs créés' : 'devoir créé'}
                    </Text>
                    {classLabel && <Text style={styles.statMeta}>Classe de {classLabel}</Text>}
                  </View>
                </View>
              )}
            </HeroCard>

            <View style={styles.actions}>
              <PrimaryButton
                label="Créer un devoir"
                icon="camera-outline"
                onPress={() => router.push('/create')}
              />
              <SecondaryButton
                label="Mes devoirs"
                icon="document-text-outline"
                onPress={() => router.navigate('/my-quizzes')}
              />
            </View>

            {home.status === 'ready' && home.recent.length > 0 && (
              <View style={styles.recent}>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionTitle} accessibilityRole="header">
                    Derniers devoirs
                  </Text>
                  <Pressable
                    onPress={() => router.navigate('/my-quizzes')}
                    accessibilityRole="link"
                    hitSlop={12}
                  >
                    <Text style={styles.seeAll}>Tout voir</Text>
                  </Pressable>
                </View>
                {home.recent.map((quiz) => (
                  <RecentQuizRow key={quiz.id} quiz={quiz} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function FirstQuizHome({ greetingName }: { greetingName: string }) {
  return (
    <>
      <HeroCard>
        <Text style={styles.date}>
          {formatToday()} · Bonjour {greetingName}
        </Text>
        <Text style={styles.firstTitle} accessibilityRole="header">
          Votre premier devoir en 1 minute
        </Text>
      </HeroCard>

      <GlassCard style={styles.steps}>
        {FIRST_QUIZ_STEPS.map((step, index) => (
          <View
            key={step.label}
            style={[styles.step, index < FIRST_QUIZ_STEPS.length - 1 && styles.stepSeparator]}
            accessible
            accessibilityLabel={`Étape ${index + 1} : ${step.label}`}
          >
            <View style={[styles.stepIcon, { backgroundColor: colors.tint[step.tint].background }]}>
              <Ionicons name={step.icon} size={22} color={colors.tint[step.tint].text} />
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </View>
        ))}
      </GlassCard>

      <View style={styles.firstActions}>
        <PrimaryButton
          label="Créer mon premier devoir"
          icon="camera-outline"
          onPress={() => router.push('/create')}
        />
        <Text style={styles.firstHint}>
          Pas de manuel sous la main ? Une leçon d’exemple vous attend à l’étape photo.
        </Text>
      </View>
    </>
  );
}

function RecentQuizRow({ quiz }: { quiz: RecentQuiz }) {
  const subjectLabel = SUBJECTS.find((s) => s.value === quiz.subject)?.label ?? quiz.subject;
  const isPublished = quiz.status === 'published';
  const meta = isPublished
    ? `Publié le ${new Date(quiz.published_at ?? quiz.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      })}`
    : quiz.status === 'draft'
      ? 'Brouillon'
      : 'Archivé';

  const content = (
    <GlassCard style={styles.row}>
      <LinearGradient {...gradients.iconTile} style={styles.rowIcon}>
        <Ionicons
          name={SUBJECT_ICONS[quiz.subject] ?? 'document-text-outline'}
          size={20}
          color={colors.actionText}
        />
      </LinearGradient>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {quiz.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {subjectLabel} · {meta}
        </Text>
      </View>
      {isPublished && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </GlassCard>
  );

  // Same behavior as a row in "Mes devoirs": a published quiz opens its
  // published screen (link, share, results); a draft is display-only.
  if (!isPublished) return content;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/quiz-published',
          params: { title: quiz.title, slug: quiz.public_slug ?? '', quizId: quiz.id },
        })
      }
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    flex: 1,
  },
  schoolName: {
    ...type.schoolName,
    color: colors.text,
  },
  byline: {
    ...type.meta,
    color: colors.textSecondary,
  },
  avatar: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceGlassSoft,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
    boxShadow: shadows.avatar,
  },
  avatarText: {
    ...type.bodyStrong,
    color: colors.actionText,
  },
  pressed: {
    opacity: 0.7,
  },
  date: {
    ...type.label,
    color: colors.textOnBrandSoft,
  },
  greeting: {
    ...type.display,
    color: colors.textOnBrand,
    marginTop: 6,
  },
  statPill: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    borderRadius: radii.row,
    backgroundColor: colors.onBrandFill,
    borderWidth: 1,
    borderColor: colors.onBrandBorder,
  },
  statValue: {
    ...type.stat,
    color: colors.textOnBrand,
  },
  statLabel: {
    ...type.bodyStrong,
    color: colors.textOnBrand,
  },
  statMeta: {
    ...type.meta,
    color: colors.textOnBrandSoft,
  },
  actions: {
    gap: spacing.md,
  },
  firstTitle: {
    ...type.title,
    lineHeight: 32,
    color: colors.textOnBrand,
    marginTop: spacing.sm,
  },
  steps: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.card,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: sizes.listRow,
  },
  stepSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: colors.trackSoft,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  stepNumberText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textOnBrand,
  },
  stepLabel: {
    ...type.bodyEmphasis,
    flex: 1,
    color: colors.text,
  },
  firstActions: {
    gap: spacing.md,
  },
  firstHint: {
    ...type.label,
    lineHeight: 20,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
    color: colors.textSecondary,
  },
  recent: {
    gap: 10,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...type.sectionTitle,
    color: colors.text,
  },
  seeAll: {
    ...type.labelStrong,
    color: colors.link,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.listRow,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.row,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    ...type.bodyStrong,
    color: colors.text,
  },
  rowMeta: {
    ...type.meta,
    color: colors.textSecondary,
  },
});
