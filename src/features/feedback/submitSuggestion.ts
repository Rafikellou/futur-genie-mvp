// Placeholder for the suggestion-sending mechanism.
//
// The Suggestions screen is intentionally shipped UI-first: we want early
// teachers to see the channel exists and start thinking of ideas. The actual
// delivery is a small follow-up:
//
//   1. migration: `feedback` table (id, teacher_id, category, message,
//      created_at) with RLS allowing INSERT by the authenticated teacher only
//      and no client SELECT — nobody reads their own or others' feedback back
//      through the app;
//   2. replace the body below with a single `supabase.from('feedback').insert(...)`.
//
// Keep this feature fire-and-forget: no inbox, no replies, no status tracking
// in the app (that would drift toward an in-app messaging system, out of MVP
// scope — CLAUDE.md §6).

export type SuggestionCategory = 'feature' | 'problem' | 'other';

export type SuggestionInput = {
  category: SuggestionCategory;
  message: string;
};

export async function submitSuggestion(_input: SuggestionInput): Promise<void> {
  // Not wired yet — see note above. Resolves so the screen can show its
  // confirmation state during development.
  return Promise.resolve();
}
