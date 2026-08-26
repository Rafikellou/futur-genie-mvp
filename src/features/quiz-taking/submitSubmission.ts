// Records a student's submission in the background (Milestone 9). Best-effort
// by design: the student already sees their own correction instantly,
// computed client-side by grading.ts (Milestone 8, unchanged) — this call
// only lets the teacher see it later and must never block or worry the
// student if it fails (e.g. no network).
import { supabase } from '@shared/supabase/client';
import type { AnswerMap } from '@shared/domain/submission';

export async function submitSubmission(
  slug: string,
  studentName: string,
  answers: AnswerMap
): Promise<void> {
  try {
    await supabase.rpc('submit_quiz_answers', {
      p_slug: slug,
      p_student_name: studentName,
      p_answers: answers,
    });
  } catch {
    // Silently ignored — see file header. Nothing to surface to the student.
  }
}
