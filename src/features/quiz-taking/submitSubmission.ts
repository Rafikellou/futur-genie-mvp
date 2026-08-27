// Records a student's submission in the background (Milestone 9). Best-effort
// by design: the student already sees their own correction instantly,
// computed client-side by grading.ts (Milestone 8, unchanged) — this call
// only lets the teacher see it later and must never block or worry the
// student if it fails (e.g. no network).
import { supabase } from '@shared/supabase/client';
import type { AnswerMap } from '@shared/domain/submission';

// A dropped mobile/wifi request during the call is common enough in practice
// (observed directly: a single attempt failed silently on a plain
// connectivity blip) to warrant a couple of silent retries — still no UI, no
// student-visible state, just more resilient to a one-off network hiccup.
// Deliberately not retried: a resolved response with a Postgrest `error`
// (e.g. quiz_not_found, invalid_request) — the server was reached and
// answered, retrying the same request would just fail the same way again.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [500, 1500];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitSubmission(
  slug: string,
  studentName: string,
  answers: AnswerMap
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { error } = await supabase.rpc('submit_quiz_answers', {
        p_slug: slug,
        p_student_name: studentName,
        p_answers: answers,
      });
      // supabase-js resolves (never rejects) on a Postgrest-level error such
      // as quiz_not_found — only a network/transport failure throws. Without
      // this check, a real backend rejection was previously indistinguishable
      // from success: nothing thrown, nothing logged, no submission written.
      if (error) {
        console.warn('submitSubmission: RPC returned an error', error.message);
      }
      return;
    } catch (err) {
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      console.warn(
        `submitSubmission: request failed (attempt ${attempt}/${MAX_ATTEMPTS})`,
        err
      );
      if (isLastAttempt) return;
      await wait(RETRY_DELAY_MS[attempt - 1]);
    }
  }
}
