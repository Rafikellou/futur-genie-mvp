import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@shared/supabase/client';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/features/auth/AuthProvider';
import { COLORS } from '@/theme/colors';

type StatsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; total: number; published: number };

// Purely decorative "at a glance" numbers — not a features dashboard
// (CLAUDE.md §6 excludes complex analytics). Two cheap head-count queries
// against the teacher's own RLS-scoped rows; failure just hides the row
// instead of blocking the home screen, since it's not on the golden path.
function useHomeStats(teacherId: string | undefined): StatsState {
  const [state, setState] = useState<StatsState>({ status: 'loading' });

  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;

    Promise.all([
      supabase.from('quizzes').select('id', { count: 'exact', head: true }),
      supabase
        .from('quizzes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
    ]).then(([totalResult, publishedResult]) => {
      if (cancelled) return;
      if (totalResult.error || publishedResult.error || totalResult.count == null) {
        setState({ status: 'error' });
        return;
      }
      setState({
        status: 'ready',
        total: totalResult.count,
        published: publishedResult.count ?? 0,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  return state;
}

export default function HomeScreen() {
  const { profile, session } = useAuth();
  const greetingName = profile?.displayName?.trim() || 'enseignant·e';
  const stats = useHomeStats(session?.user.id);

  return (
    <Screen style={styles.screen}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Logo size={40} textColor="#FFFFFF" />
        <Text style={styles.greeting}>Bonjour {greetingName}</Text>
      </LinearGradient>

      <View style={styles.body}>
        {stats.status === 'ready' && stats.total > 0 && (
          // Hidden for a brand-new teacher with zero quizzes yet — "0
          // devoirs créés" on a first visit reads as empty, not encouraging.
          <View style={styles.statsRow}>
            <StatCard value={stats.total} label={stats.total > 1 ? 'devoirs créés' : 'devoir créé'} />
            <StatCard value={stats.published} label={stats.published > 1 ? 'publiés' : 'publié'} />
          </View>
        )}

        {/* Actions sit in the middle of the screen rather than stacked at the
            top, so the home screen doesn't leave the lower half empty. */}
        <View style={styles.actions}>
          <Link href="/create" asChild>
            <Pressable
              style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.createButtonIcon}>📷</Text>
              <Text style={styles.createButtonText}>Créer un devoir</Text>
            </Pressable>
          </Link>

          <Link href="/my-quizzes" asChild>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Mes devoirs</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 18,
    // Soft depth so the header reads as a raised band rather than a flat
    // color block, without pulling in a shadow/elevation library.
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    padding: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryPressed,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryPressed,
    textAlign: 'center',
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  createButtonIcon: {
    fontSize: 18,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
});
