import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@shared/supabase/client';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/features/auth/AuthProvider';
import { COLORS } from '@/theme/colors';

type StatsState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; total: number };

// Purely decorative "at a glance" number — not a features dashboard
// (CLAUDE.md §6 excludes complex analytics). A single cheap head-count query
// against the teacher's own RLS-scoped rows; failure just hides the row
// instead of blocking the home screen, since it's not on the golden path.
//
// Only "created" is tracked, not "published": drafting and publishing happen
// as one action (see quiz-draft.tsx's handlePublish), so every row in
// `quizzes` is published in practice — a second "published" count would
// almost always just repeat the same number.
function useHomeStats(teacherId: string | undefined): StatsState {
  const [state, setState] = useState<StatsState>({ status: 'loading' });

  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;

    supabase
      .from('quizzes')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (cancelled) return;
        if (error || count == null) {
          setState({ status: 'error' });
          return;
        }
        setState({ status: 'ready', total: count });
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
      <View style={styles.container}>
        <Logo size={40} style={styles.logo} />

        {/* One composed "hero" card rather than a full-bleed banner plus a
            separately floating stat card: the greeting and the count are the
            same idea (this teacher's activity), so they read as one unit. */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.greeting}>Bonjour {greetingName}</Text>

          {stats.status === 'ready' && stats.total > 0 && (
            // Hidden for a brand-new teacher with zero quizzes yet — "0
            // devoirs créés" on a first visit reads as empty, not encouraging.
            <>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
                <Text style={styles.heroStatText}>
                  <Text style={styles.heroStatValue}>{stats.total}</Text>{' '}
                  {stats.total > 1 ? 'devoirs créés' : 'devoir créé'}
                </Text>
              </View>
            </>
          )}
        </LinearGradient>

        <View style={styles.actions}>
          <Link href="/create" asChild>
            <Pressable style={styles.createButton} accessibilityRole="button">
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Créer un devoir</Text>
            </Pressable>
          </Link>

          <Link href="/my-quizzes" asChild>
            <Pressable style={styles.secondaryButton} accessibilityRole="button">
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Mes devoirs</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  logo: {
    marginBottom: 20,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  actions: {
    marginTop: 28,
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
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
