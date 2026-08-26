import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '@shared/supabase/client';

// Minimal entry point (Milestone 9): just enough to see one's own quizzes and
// reach a published one's results. Full history UX (filters, reopen a draft,
// etc.) is Milestone 10 — this screen is deliberately the smallest useful
// version, built on the same `quizzes` table.
type QuizRow = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; rows: QuizRow[] };

export default function MyQuizzesScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setState({ status: 'loading' });

    // RLS (Milestone 7) already restricts this to the signed-in teacher's own
    // rows — no explicit teacher_id filter needed.
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false });

    if (error || !data) {
      setState({ status: 'error' });
    } else {
      setState({ status: 'ready', rows: data });
    }
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.back}>‹ Retour</Text>
      </Pressable>
      <Text style={styles.title}>Mes devoirs</Text>

      {state.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      )}

      {state.status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.body}>Impossible de charger vos devoirs pour le moment.</Text>
          <Pressable style={styles.button} onPress={() => load()} accessibilityRole="button">
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {state.status === 'ready' && state.rows.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.body}>Vous n&apos;avez pas encore créé de devoir.</Text>
        </View>
      )}

      {state.status === 'ready' && state.rows.length > 0 && (
        <FlatList
          data={state.rows}
          keyExtractor={(row) => row.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />
          }
          renderItem={({ item }) => (
            <QuizRowItem row={item} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

function QuizRowItem({ row }: { row: QuizRow }) {
  const date = new Date(row.created_at).toLocaleDateString('fr-FR');
  const statusLabel = row.status === 'published' ? 'Publié' : row.status === 'draft' ? 'Brouillon' : 'Archivé';

  const content = (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowMeta}>
          {statusLabel} · {date}
        </Text>
      </View>
      {row.status === 'published' && <Text style={styles.rowChevron}>›</Text>}
    </View>
  );

  if (row.status !== 'published') {
    // A draft has no public results to show, and this screen doesn't yet
    // support resuming one (Milestone 10) — display only.
    return <View style={styles.rowDisabled}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/quiz-results', params: { quizId: row.id, title: row.title } })
      }
      accessibilityRole="button"
      style={styles.rowPressable}
    >
      {content}
    </Pressable>
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
  rowPressable: {
    borderRadius: 12,
  },
  rowDisabled: {
    opacity: 0.6,
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
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  rowMeta: {
    fontSize: 13,
    color: '#777777',
  },
  rowChevron: {
    fontSize: 20,
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
