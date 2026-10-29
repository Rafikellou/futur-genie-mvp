import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@shared/supabase/client';
import { GRADES } from '@shared/domain/grade';
import { SUBJECTS, type Subject } from '@shared/domain/subject';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useAboveTabBarOffset, useTabBarSpace } from '@/components/TabBar';
import {
  confirmDeleteQuizzes,
  DELETE_ERROR_MESSAGE,
  deleteQuizzes,
} from '@/features/quiz-publishing/deleteQuizzes';
import { composeShareText } from '@/features/quiz-sharing/composeShareText';
import { copyText, shareText } from '@/features/quiz-sharing/shareOrCopy';
import {
  colors,
  fonts,
  gradients,
  radii,
  shadows,
  sizes,
  spacing,
  subjectStyles,
  type,
} from '@/theme';

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
  grade: string;
  subject: Subject;
  // Only the questions array of `quiz_data`, to show the count on each row.
  questions: unknown;
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

// Room left under the list for the selection bar in select mode.
const FOOTER_SPACE = 140;

export default function MyQuizzesScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const tabBarSpace = useTabBarSpace();
  const selectionBarBottom = useAboveTabBarOffset();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const hasLoaded = useRef(false);

  // 'silent' refreshes on return to the tab (e.g. after deleting a quiz from
  // its results screen) without flashing the loading state over the list.
  const load = useCallback(async (mode: 'initial' | 'pull' | 'silent' = 'initial') => {
    if (mode === 'pull') setIsRefreshing(true);
    else if (mode === 'initial') setState({ status: 'loading' });

    // RLS (Milestone 7) already restricts this to the signed-in teacher's own
    // rows — no explicit teacher_id filter needed.
    const { data, error } = await supabase
      .from('quizzes')
      .select(
        'id, title, status, grade, subject, questions:quiz_data->questions, created_at, published_at, public_slug'
      )
      .order('created_at', { ascending: false });

    if (error || !data) {
      // A failed background refresh keeps the list already on screen.
      if (mode !== 'silent') setState({ status: 'error' });
    } else {
      hasLoaded.current = true;
      setState({ status: 'ready', rows: data as QuizRow[] });
      // Drop selected ids that no longer exist (deleted meanwhile), so the
      // counts and a retried delete only cover quizzes still on screen.
      const existing = new Set(data.map((row) => row.id));
      setSelectedIds((current) => {
        const next = new Set([...current].filter((id) => existing.has(id)));
        return next.size === current.size ? current : next;
      });
    }
    setIsRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current ? 'silent' : 'initial');
    }, [load])
  );

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

  // Only published quizzes have a link to share; drafts can still be
  // selected, but only for deletion.
  const selectedQuizzes = useMemo(() => {
    if (state.status !== 'ready') return [];
    return state.rows.filter((row) => selectedIds.has(row.id) && row.public_slug);
  }, [state, selectedIds]);
  const hasUnshareableSelected = selectedQuizzes.length < selectedIds.size;

  const sections = useMemo(
    () => (state.status === 'ready' ? groupByDay(state.rows) : []),
    [state]
  );

  const canSelect = state.status === 'ready' && state.rows.length > 0;

  function handleDeleteSelected() {
    const ids = [...selectedIds];
    confirmDeleteQuizzes(ids.length, async () => {
      setIsDeleting(true);
      setDeleteFailed(false);
      const ok = await deleteQuizzes(ids);
      setIsDeleting(false);
      if (ok) exitSelectMode();
      else setDeleteFailed(true);
      // Reload either way: a partial failure may still have removed some rows.
      load('silent');
    });
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Mes devoirs
        </Text>
        {canSelect && (
          <Pressable
            onPress={() => (isSelectMode ? exitSelectMode() : setIsSelectMode(true))}
            accessibilityRole="button"
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            {!isSelectMode && (
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.actionText} />
            )}
            <Text style={styles.headerButtonText}>{isSelectMode ? 'Annuler' : 'Sélectionner'}</Text>
          </Pressable>
        )}
      </View>

      {deleteFailed && (
        <View style={styles.selectHint}>
          <Banner tone="error" messages={DELETE_ERROR_MESSAGE} />
        </View>
      )}

      {isSelectMode && (
        <View style={styles.selectHint}>
          <Banner
            tone="info"
            messages="Cochez des devoirs pour les partager en un seul message ou les supprimer."
          />
        </View>
      )}

      {state.status === 'loading' && (
        <View style={styles.state}>
          <EmptyState variant="loading" title="Chargement…" body="Vos devoirs arrivent." />
        </View>
      )}

      {state.status === 'error' && (
        <View style={styles.state}>
          <EmptyState
            variant="problem"
            icon="wifi-outline"
            title="Impossible de charger"
            body="Vérifiez votre connexion, puis réessayez."
            action={{ label: 'Réessayer', onPress: () => load() }}
          />
        </View>
      )}

      {state.status === 'ready' && state.rows.length === 0 && (
        <View style={styles.state}>
          <EmptyState
            variant="info"
            icon="document-text-outline"
            title="Prêt pour votre premier devoir ?"
            body="Créez-le en une minute à partir d’une photo de leçon."
            action={{ label: 'Créer un devoir', onPress: () => router.push('/create'), primary: true }}
          />
        </View>
      )}

      {state.status === 'ready' && state.rows.length > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={(row) => row.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load('pull')}
              tintColor={colors.brandViolet}
              colors={[colors.brandViolet]}
            />
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
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarSpace + (isSelectMode ? FOOTER_SPACE : 0) },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {isSelectMode && selectedIds.size > 0 && (
        <View style={[styles.selectionBar, { bottom: selectionBarBottom }]}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </Text>
            {hasUnshareableSelected && (
              <Text style={styles.selectionNote}>
                {selectedIds.size - selectedQuizzes.length > 1
                  ? 'Les brouillons ne seront pas partagés'
                  : 'Le brouillon ne sera pas partagé'}
              </Text>
            )}
          </View>
          <View style={styles.selectionActions}>
            <PrimaryButton
              label={`Partager (${selectedQuizzes.length})`}
              icon="share-outline"
              onPress={() => setIsComposeOpen(true)}
              disabled={selectedQuizzes.length === 0 || isDeleting}
              style={styles.selectionButton}
            />
            <Pressable
              onPress={handleDeleteSelected}
              disabled={isDeleting}
              accessibilityRole="button"
              accessibilityLabel={`Supprimer ${selectedIds.size} devoir${selectedIds.size > 1 ? 's' : ''}`}
              accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
              style={({ pressed }) => [
                styles.selectionButton,
                styles.deleteButton,
                (pressed || isDeleting) && styles.pressed,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color={colors.dangerOnDark} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color={colors.dangerOnDark} />
                  <Text style={styles.deleteButtonText}>Supprimer ({selectedIds.size})</Text>
                </>
              )}
            </Pressable>
          </View>
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
  const statusLabel = row.status === 'published' ? 'Publié' : row.status === 'draft' ? 'Brouillon' : 'Archivé';
  const gradeLabel = GRADES.find((g) => g.value === row.grade)?.label ?? row.grade;
  const subjectLabel = SUBJECTS.find((s) => s.value === row.subject)?.label ?? row.subject;
  const questionCount = Array.isArray(row.questions) ? row.questions.length : null;
  const subjectStyle = subjectStyles[row.subject] ?? subjectStyles.autre;

  const statusBadge = (
    <View style={[styles.statusBadge, row.status === 'published' && styles.statusBadgePublished]}>
      <Text style={[styles.statusText, row.status === 'published' && styles.statusTextPublished]}>
        {statusLabel}
      </Text>
    </View>
  );

  const content = isSelectMode ? (
    <View style={[styles.row, isSelected && styles.rowSelected]}>
      <View style={[styles.checkbox, !isSelected && styles.checkboxEmpty]}>
        {isSelected && (
          <>
            <LinearGradient {...gradients.selected} style={styles.checkboxFill} />
            <Ionicons name="checkmark" size={16} color={colors.textOnBrand} />
          </>
        )}
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <View style={styles.rowMetaLine}>
          {statusBadge}
          <Text style={styles.rowMeta} numberOfLines={1}>
            {gradeLabel} · {subjectLabel}
          </Text>
        </View>
      </View>
    </View>
  ) : (
    <View style={styles.row}>
      <View style={[styles.subjectTile, { backgroundColor: subjectStyle.tint.background }]}>
        <Text
          style={[styles.subjectTag, { color: subjectStyle.tint.text }]}
          accessibilityLabel={subjectLabel}
        >
          {subjectStyle.tag}
        </Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <View style={styles.rowMetaLine}>
          {statusBadge}
          <Text style={styles.rowMeta} numberOfLines={1}>
            {gradeLabel}
            {questionCount != null
              ? ` · ${questionCount} question${questionCount > 1 ? 's' : ''}`
              : ''}
          </Text>
        </View>
      </View>
      {row.status === 'published' && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </View>
  );

  if (isSelectMode) {
    return (
      <Pressable
        onPress={onToggleSelected}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={row.title}
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
      style={({ pressed }) => pressed && styles.pressed}
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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setText(composeShareText(quizzes));
      setCopyFeedback(false);
    }
    // Only regenerate when the modal opens with a (possibly new) selection —
    // not on every keystroke while the teacher is editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function handleCopy() {
    const ok = await copyText(text);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }

  // A transparent RN Modal styled as a bottom sheet over a dimmed backdrop.
  // Faded in rather than slid, so the backdrop doesn't slide up with it.
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={{ height: insets.top + spacing.lg }}
          onPress={onClose}
          accessibilityLabel="Fermer"
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <KeyboardAvoidingView
          style={styles.sheetWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}
            accessibilityViewIsModal
          >
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} accessibilityRole="header">
                Partager {quizzes.length} devoir{quizzes.length > 1 ? 's' : ''}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetBody}>Vous pouvez modifier le message avant de l’envoyer.</Text>

            <TextInput
              style={styles.composeInput}
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Message à partager"
            />

            <View style={styles.shareRow}>
              <PrimaryButton
                label="Partager"
                icon="share-outline"
                onPress={() => shareText(text)}
                style={styles.shareButton}
              />
              <Pressable
                onPress={handleCopy}
                accessibilityRole="button"
                accessibilityLabel={copyFeedback ? 'Texte copié' : 'Copier le texte'}
                style={({ pressed }) => [
                  styles.shareButton,
                  styles.copyButton,
                  copyFeedback && styles.copyButtonDone,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={copyFeedback ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copyFeedback ? colors.success.text : colors.actionText}
                />
                <Text style={[styles.copyText, copyFeedback && styles.copyTextDone]}>
                  {copyFeedback ? 'Texte copié' : 'Copier le texte'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screen,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: sizes.touchTarget,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
  },
  headerButtonText: {
    ...type.labelStrong,
    color: colors.actionText,
  },
  selectHint: {
    marginBottom: spacing.xs,
  },
  state: {
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  sectionHeader: {
    ...type.metaStrong,
    letterSpacing: 0.78,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.row,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
  },
  rowSelected: {
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1.5,
    borderColor: colors.brandViolet,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  subjectTile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectTag: {
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    ...type.bodyStrong,
    lineHeight: 19,
    color: colors.text,
  },
  rowMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowMeta: {
    ...type.meta,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  statusBadge: {
    height: 20,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  statusBadgePublished: {
    backgroundColor: colors.success.background,
  },
  statusText: {
    ...type.metaStrong,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusTextPublished: {
    color: colors.success.text,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radii.badge,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkboxEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  checkboxFill: {
    ...StyleSheet.absoluteFill,
  },
  selectionBar: {
    position: 'absolute',
    left: sizes.tabBarMargin,
    right: sizes.tabBarMargin,
    gap: 10,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.text,
    boxShadow: shadows.selectionBar,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: 6,
  },
  selectionCount: {
    ...type.bodyStrong,
    color: colors.textOnBrand,
  },
  selectionNote: {
    ...type.meta,
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
    color: colors.textOnDarkMuted,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectionButton: {
    flex: 1,
    minHeight: sizes.compactButton,
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.onDarkBorder,
    backgroundColor: colors.onDarkFill,
  },
  deleteButtonText: {
    ...type.buttonSecondary,
    fontSize: 15,
    color: colors.dangerOnDark,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
  },
  sheetWrapper: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.sheet,
    boxShadow: shadows.bottomSheet,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.trackDashed,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sheetTitle: {
    ...type.title,
    fontSize: 26,
    flexShrink: 1,
    color: colors.text,
  },
  closeButton: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.track,
  },
  sheetBody: {
    ...type.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  composeInput: {
    ...type.input,
    flex: 1,
    padding: spacing.lg,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButton: {
    flex: 1,
    minHeight: sizes.secondaryButton,
    borderRadius: radii.row,
    paddingHorizontal: spacing.md,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyButtonDone: {
    borderWidth: 1.5,
    borderColor: colors.success.border,
    backgroundColor: colors.success.background,
  },
  copyText: {
    ...type.buttonSecondary,
    color: colors.actionText,
  },
  copyTextDone: {
    color: colors.success.text,
  },
});
