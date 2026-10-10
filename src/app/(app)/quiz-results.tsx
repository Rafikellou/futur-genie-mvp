import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { supabase } from '@shared/supabase/client';
import { colors, fonts, gradients, radii, spacing, type } from '@/theme';

// Per-quiz results screen (Milestone 9, CLAUDE.md §5): who answered a given
// published quiz, and how they scored — the teacher's only view into student
// submissions. RLS (submissions table) already restricts rows to quizzes the
// signed-in teacher owns; no separate ownership check is needed here.
type SubmissionRow = {
  id: string;
  student_name: string;
  correct_count: number;
  gradable_count: number;
  created_at: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; rows: SubmissionRow[] };

export default function QuizResultsScreen() {
  const { quizId, title } = useLocalSearchParams<{ quizId: string; title?: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const { data, error } = await supabase
      .from('submissions')
      .select('id, student_name, correct_count, gradable_count, created_at')
      .eq('quiz_id', quizId);

    if (error || !data) {
      setState({ status: 'error' });
      return;
    }

    // Struggling students first: sort by score ratio ascending. A submission
    // with no auto-gradable question (short-answer-only quiz) has no ratio
    // to sort by — those sink to the bottom rather than being mistaken for
    // a perfect or a zero score.
    const sorted = [...data].sort((a, b) => ratio(a) - ratio(b));
    setState({ status: 'ready', rows: sorted });
  }, [quizId]);

  useEffect(() => {
    load();
  }, [load]);

  const header = (
    <View style={styles.header}>
      <BackButton onPress={() => router.back()} />
      <View>
        <Text style={styles.overline}>Réponses des élèves</Text>
        {title ? (
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
      </View>
      {state.status === 'ready' && state.rows.length > 0 && (
        // Count of the rows already loaded — no extra query.
        <GlassCard style={styles.countCard}>
          <LinearGradient {...gradients.iconTile} style={styles.countIcon}>
            <Ionicons name="people-outline" size={20} color={colors.actionText} />
          </LinearGradient>
          <Text style={styles.countText}>
            {state.rows.length} élève{state.rows.length > 1 ? 's ont' : ' a'} fait ce devoir
          </Text>
        </GlassCard>
      )}
    </View>
  );

  return (
    <Screen>
      {state.status === 'ready' && state.rows.length > 0 ? (
        <FlatList
          data={state.rows}
          keyExtractor={(row) => row.id}
          ListHeaderComponent={header}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => <SubmissionRowItem row={item} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.content}>
          {header}

          {state.status === 'loading' && (
            <EmptyState variant="loading" title="Chargement…" body="Les réponses arrivent." />
          )}

          {state.status === 'error' && (
            <EmptyState
              variant="problem"
              icon="wifi-outline"
              title="Impossible de charger"
              body="Vérifiez votre connexion, puis réessayez."
              action={{ label: 'Réessayer', onPress: load }}
            />
          )}

          {state.status === 'ready' && (
            <EmptyState
              variant="info"
              icon="people-outline"
              title="Aucune réponse pour l’instant"
              body="Les élèves apparaîtront ici dès qu’ils auront fait le devoir."
            />
          )}
        </View>
      )}
    </Screen>
  );
}

// Missing gradable questions (short-answer-only quiz) sort last: treated as
// "no signal" rather than a perfect (1) or failing (0) score.
function ratio(row: SubmissionRow): number {
  return row.gradable_count > 0 ? row.correct_count / row.gradable_count : Infinity;
}

// Neutral styling for every row, whatever the score: no red, no "à revoir"
// label (docs/design/README §5.3). The bar mirrors the score text, which
// carries the information on its own.
function SubmissionRowItem({ row }: { row: SubmissionRow }) {
  const when = new Date(row.created_at);
  const date = `${when.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} · ${when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  const hasScore = row.gradable_count > 0;
  const initial = row.student_name.trim().charAt(0).toUpperCase() || '?';

  return (
    <GlassCard style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {row.student_name}
        </Text>
        <Text style={styles.rowMeta}>{date}</Text>
        {hasScore && (
          <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <LinearGradient
              {...gradients.selected}
              style={[styles.barFill, { width: `${(row.correct_count / row.gradable_count) * 100}%` }]}
            />
          </View>
        )}
      </View>
      {hasScore ? (
        <Text
          style={styles.score}
          accessibilityLabel={`${row.correct_count} sur ${row.gradable_count}`}
        >
          {row.correct_count} / {row.gradable_count}
        </Text>
      ) : (
        <Text style={styles.score} accessibilityLabel="Pas de score">
          —
        </Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: 30,
    gap: 10,
  },
  header: {
    gap: 14,
    marginBottom: spacing.xs,
  },
  overline: {
    ...type.metaStrong,
    letterSpacing: 0.78,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  title: {
    ...type.heroTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceGlassStrong,
  },
  countIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...type.bodyStrong,
    flex: 1,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 68,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.row,
    backgroundColor: colors.surfaceGlassStrong,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint.blue.background,
  },
  avatarText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.tint.blue.text,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  rowName: {
    ...type.bodyEmphasis,
    color: colors.text,
  },
  rowMeta: {
    ...type.meta,
    color: colors.textSecondary,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.trackSoft,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  score: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
  },
});
