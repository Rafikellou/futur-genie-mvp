// One student's answers to one published quiz (Milestone 9, CLAUDE.md §16).
// Shared between the student route (src/app/q/[slug].tsx, grading.ts) that
// produces an AnswerMap and the teacher-facing results screen that reads
// Submission rows back — one definition, no drift (CLAUDE.md §46).
export type StudentAnswer =
  | { type: 'multiple_choice'; value: string | null }
  | { type: 'true_false'; value: boolean | null }
  | { type: 'short_answer'; value: string };

export type AnswerMap = Record<string, StudentAnswer>;

// Mirrors the `submissions` table (supabase/migrations/20260826090000_create_submissions.sql).
// `correctCount`/`gradableCount` are always computed server-side by the
// submit_quiz_answers() RPC — never trusted from the client.
export type Submission = {
  id: string;
  quizId: string;
  studentName: string;
  answers: AnswerMap;
  correctCount: number;
  gradableCount: number;
  createdAt: string;
};
