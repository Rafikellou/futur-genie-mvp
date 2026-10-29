import { Alert } from 'react-native';

import { supabase } from '@shared/supabase/client';

// Deletes the signed-in teacher's own quizzes. Authorization lives in the
// database: the "Teachers can delete their own quizzes" RLS policy limits the
// delete to rows the teacher owns, and submissions.quiz_id cascades, so the
// students' answers go with the quiz (supabase/tests/delete_quiz_rls.sql).
//
// RLS filters silently rather than erroring, so a row the teacher can't
// delete (or that's already gone) just isn't in the result. Counting the
// returned rows is what tells a real success from a no-op.
export async function deleteQuizzes(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const { data, error } = await supabase.from('quizzes').delete().in('id', ids).select('id');
  return !error && data != null && data.length === ids.length;
}

// Native confirmation (docs/design Fenetres.dc.html, 9th alert).
export function confirmDeleteQuizzes(count: number, onConfirm: () => void) {
  Alert.alert(
    count > 1 ? `Supprimer ces ${count} devoirs ?` : 'Supprimer ce devoir ?',
    count > 1
      ? 'Les liens ne fonctionneront plus et les réponses des élèves seront effacées.'
      : 'Le lien ne fonctionnera plus et les réponses des élèves seront effacées.',
    [
      { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
      { text: 'Annuler' },
    ]
  );
}

export const DELETE_ERROR_MESSAGE =
  "Le devoir n'a pas pu être supprimé. Vérifiez votre connexion, puis réessayez.";
