import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@shared/supabase/client';
import { Screen } from '@/components/Screen';
import { composeShareText } from '@/features/quiz-sharing/composeShareText';
import { copyText, shareText } from '@/features/quiz-sharing/shareOrCopy';
import { COLORS } from '@/theme/colors';

// Minimal entry point (Milestone 9): just enough to see one's own quizzes and
// reach a published one's results. Full history UX (filters, reopen a draft,
// etc.) is Milestone 10 — this screen is deliberately the smallest useful
// version, built on the same `quizzes` table.
//
// Milestone 10 also adds a selection mode on this same screen (rather than a
// separate list+screen) so a teacher can share several published quizzes —
// e.g. one per subject — as a single message, instead of repeating the
// single-quiz share once per quiz.
type QuizRow = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string | null;
  public_slug: string | null;
};

type QuizSection = { title: string; data: QuizRow[] };

// Groups quizzes into day-labelled blocks ("Aujourd'hui", "Hier", then a
// full date) so a teacher scanning the list can tell at a glance which
// devoirs went out together. A published quiz is filed under its publish
// day; a draft (never published) under the day it was created.
function groupByDay(rows: QuizRow[]): QuizSection[] {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());

  const effective = (row: QuizRow) => new Date(row.published_at ?? row.created_at).getTime();
  const ordered = [...rows].sort((a, b) => effective(b) - effective(a));

  const sections: QuizSection[] = [];
  let current: QuizSection | null = null;

  for (const row of ordered) {
    const when = new Date(row.published_at ?? row.created_at);
    const dayStart = startOfDay(when);
    const diffDays = Math.round((today - dayStart) / 86_400_000);

    let label: string;
    if (diffDays <= 0) label = "Aujourd'hui";
    else if (diffDays === 1) label = 'Hier';
    else {
      const formatted = when.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      label = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    if (!current || current.title !== label) {
      current = { title: label, data: [] };
      sections.push(current);
    }
    current.data.push(row);
  }

  return sections;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; rows: QuizRow[] };

export default function MyQuizzesScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setState({ status: 'loading' });

    // RLS (Milestone 7) already restricts this to the signed-in teacher's own
    // rows — no explicit teacher_id filter needed.
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title, status, created_at, published_at, public_slug')
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

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedQuizzes = useMemo(() => {
    if (state.status !== 'ready') return [];
    return state.rows.filter((row) => selectedIds.has(row.id) && row.public_slug);
  }, [state, selectedIds]);

  const sections = useMemo(
    () => (state.status === 'ready' ? groupByDay(state.rows) : []),
    [state]
  );

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        {state.status === 'ready' &&
          state.rows.filter((r) => r.status === 'published').length > 1 && (
            <Pressable
              onPress={() => (isSelectMode ? exitSelectMode() : setIsSelectMode(true))}
              accessibilityRole="button"
            >
              <Text style={styles.selectToggle}>
                {isSelectMode ? 'Annuler' : 'Partager plusieurs'}
              </Text>
            </Pressable>
          )}
      </View>
      <Text style={styles.title}>Mes devoirs</Text>

      {isSelectMode && (
        <Text style={styles.selectHint}>
          Cochez les devoirs à envoyer, puis partagez-les en un seul message.
        </Text>
      )}

      {state.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
        <SectionList
          sections={sections}
          keyExtractor={(row) => row.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <QuizRowItem
              row={item}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelected={() => toggleSelected(item.id)}
            />
          )}
          contentContainerStyle={[styles.list, isSelectMode && styles.listWithFooter]}
        />
      )}

      {isSelectMode && selectedIds.size > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionCount}>
            {selectedQuizzes.length} sélectionné{selectedQuizzes.length > 1 ? 's' : ''}
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => setIsComposeOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Partager la sélection</Text>
          </Pressable>
        </View>
      )}

      <ShareComposeModal
        visible={isComposeOpen}
        quizzes={selectedQuizzes.map((q) => ({ title: q.title, publicSlug: q.public_slug! }))}
        onClose={() => setIsComposeOpen(false)}
      />
    </Screen>
  );
}

function QuizRowItem({
  row,
  isSelectMode,
  isSelected,
  onToggleSelected,
}: {
  row: QuizRow;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelected: () => void;
}) {
  const date = new Date(row.created_at).toLocaleDateString('fr-FR');
  const statusLabel = row.status === 'published' ? 'Publié' : row.status === 'draft' ? 'Brouillon' : 'Archivé';
  const isSelectable = isSelectMode && row.status === 'published';

  const content = (
    <View style={styles.row}>
      {isSelectMode && (
        <View style={[styles.checkbox, isSelected && styles.checkboxChecked, !isSelectable && styles.checkboxDisabled]}>
          {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowMeta}>
          {statusLabel} · {date}
        </Text>
      </View>
      {!isSelectMode && row.status === 'published' && <Text style={styles.rowChevron}>›</Text>}
    </View>
  );

  if (isSelectMode) {
    if (!isSelectable) {
      // A draft has no public link, so it can't be part of a shared
      // message — same "display only" treatment as outside select mode.
      return <View style={styles.rowDisabled}>{content}</View>;
    }
    return (
      <Pressable
        onPress={onToggleSelected}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        style={styles.rowPressable}
      >
        {content}
      </Pressable>
    );
  }

  if (row.status !== 'published') {
    // A draft has no public results to show, and this screen doesn't yet
    // support resuming one (Milestone 10 history view) — display only.
    return <View style={styles.rowDisabled}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() =>
        // Opens the published-quiz screen (public link + share/copy), the
        // same one shown right after publishing. Student results are one tap
        // further, via its "Voir les réponses des élèves" button.
        router.push({
          pathname: '/quiz-published',
          params: { title: row.title, slug: row.public_slug ?? '', quizId: row.id },
        })
      }
      accessibilityRole="button"
      style={styles.rowPressable}
    >
      {content}
    </Pressable>
  );
}

function ShareComposeModal({
  visible,
  quizzes,
  onClose,
}: {
  visible: boolean;
  quizzes: { title: string; publicSlug: string }[];
  onClose: () => void;
}) {
  // The teacher can tweak the generated message before it goes out — she
  // stays in control of what's ultimately sent, same principle as reviewing
  // an AI-generated quiz before publishing it (CLAUDE.md §3).
  const [text, setText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (visible) {
      setText(composeShareText(quizzes));
      setCopyFeedback(false);
    }
    // Only regenerate when the modal opens with a (possibly new) selection —
    // not on every keystroke while the teacher is editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen style={styles.modalContainer}>
        <Pressable onPress={onClose} accessibilityRole="button">
          <Text style={styles.back}>‹ Annuler</Text>
        </Pressable>
        <Text style={styles.title}>Partager {quizzes.length} devoir{quizzes.length > 1 ? 's' : ''}</Text>
        <Text style={styles.body}>Vous pouvez modifier le message avant de l&apos;envoyer.</Text>

        <TextInput
          style={styles.composeInput}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Message à partager"
        />

        <View style={styles.shareRow}>
          <Pressable
            style={styles.shareButton}
            onPress={() => shareText(text)}
            accessibilityRole="button"
          >
            <Text style={styles.shareButtonText}>Partager</Text>
          </Pressable>
          <Pressable
            style={styles.shareButton}
            onPress={async () => {
              const ok = await copyText(text);
              if (ok) {
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2000);
              }
            }}
            accessibilityRole="button"
          >
            <Text style={styles.shareButtonText}>{copyFeedback ? 'Texte copié ✓' : 'Copier le texte'}</Text>
          </Pressable>
        </View>
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 24,
    marginBottom: 4,
  },
  back: {
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 12,
  },
  selectToggle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  selectHint: {
    fontSize: 14,
    color: '#555555',
    marginTop: -8,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#777777',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 2,
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
  listWithFooter: {
    paddingBottom: 96,
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
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxDisabled: {
    borderColor: '#CCCCCC',
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rowText: {
    flexShrink: 1,
    flexGrow: 1,
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
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  composeInput: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    marginVertical: 16,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
