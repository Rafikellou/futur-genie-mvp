import { Platform } from 'react-native';

// No production web domain has been chosen/deployed yet — that is
// Milestone 10 ("production environment configuration", CLAUDE.md §15).
// `EXPO_PUBLIC_APP_URL` lets a developer point this at wherever the web
// build is actually reachable (e.g. a preview deployment) until then; it is
// safe to expose (no secret — same reasoning as EXPO_PUBLIC_SUPABASE_URL).
const CONFIGURED_APP_URL = process.env.EXPO_PUBLIC_APP_URL;

// Builds the full public URL for a published quiz's slug. On web, the
// browser's own origin is always correct for wherever the app is currently
// served from, so it takes priority over the configured constant.
export function buildPublicQuizUrl(slug: string): string {
  const path = `/q/${slug}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }

  if (CONFIGURED_APP_URL) {
    return `${CONFIGURED_APP_URL.replace(/\/$/, '')}${path}`;
  }

  return path;
}
