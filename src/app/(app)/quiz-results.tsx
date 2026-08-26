import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { supabase } from '@shared/supabase/client';

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

  return (
    <Screen style={styles.container}>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.back}>‹ Retour</Text>
      </Pressable>
      <Text style={styles.title}>{title || 'Réponses des élèves'}</Text>

      {state.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      )}

      {state.status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.body}>Impossible de charger les réponses pour le moment.</Text>
          <Pressable style={styles.button} onPress={load} accessibilityRole="button">
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {state.status === 'ready' && state.rows.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.body}>Aucune réponse pour l&apos;instant.</Text>
        </View>
      )}

      {state.status === 'ready' && state.rows.length > 0 && (
        <FlatList
          data={state.rows}
          keyExtractor={(row) => row.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SubmissionRowItem row={item} />}
        />
      )}
    </Screen>
  );
}

// Missing gradable questions (short-answer-only quiz) sort last: treated as
// "no signal" rather than a perfect (1) or failing (0) score.
function ratio(row: SubmissionRow): number {
  return row.gradable_count > 0 ? row.correct_count / row.gradable_count : Infinity;
}

function SubmissionRowItem({ row }: { row: SubmissionRow }) {
  const date = new Date(row.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const hasScore = row.gradable_count > 0;
  const isLow = hasScore && row.correct_count / row.gradable_count < 0.5;

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{row.student_name}</Text>
        <Text style={styles.rowMeta}>{date}</Text>
      </View>
      {hasScore ? (
        <Text style={[styles.rowScore, isLow && styles.rowScoreLow]}>
          {row.correct_count} / {row.gradable_count}
        </Text>
      ) : (
        <Text style={styles.rowScoreNone}>—</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  back: {
    color: '#208AEF',
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    gap: 12,
  },
  body: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 16,
  },
  rowText: {
    flexShrink: 1,
    gap: 4,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  rowMeta: {
    fontSize: 13,
    color: '#777777',
  },
  rowScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E9E5B',
  },
  rowScoreLow: {
    color: '#D9463F',
  },
  rowScoreNone: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
