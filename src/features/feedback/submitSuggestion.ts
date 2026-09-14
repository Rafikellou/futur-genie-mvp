// Records a teacher's suggestion from the Suggestions screen. Fire-and-forget
// by design (CLAUDE.md §6): no inbox, no replies, no status tracking in the
// app. `teacher_id` is omitted — it defaults to auth.uid() server-side, same
// pattern as quizzes (CLAUDE.md §48: never trust a client-provided owner id).
import { supabase } from '@shared/supabase/client';

export type SuggestionCategory = 'feature' | 'problem' | 'other';

export type SuggestionInput = {
  category: SuggestionCategory;
  message: string;
};

export async function submitSuggestion(input: SuggestionInput): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    category: input.category,
    message: input.message,
  });

  if (error) {
    throw error;
  }
}
