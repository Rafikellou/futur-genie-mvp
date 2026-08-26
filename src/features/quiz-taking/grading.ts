// Pure, dependency-free grading logic for the public quiz route
// (src/app/q/[slug].tsx). Kept separate from the screen so the rules are
// easy to read and reason about on their own — no React, no Supabase.
//
// Correction is entirely client-side: the correct answer already lives in
// `public_quiz_data` (only hidden in the UI until submission). This is a
// deliberate MVP tradeoff recorded in PROGRESS.md ("Correction élève") —
// no submissions table, no server-side grading.
import type { PublicQuestion } from '@shared/domain/quiz';
import type { AnswerMap, StudentAnswer } from '@shared/domain/submission';

// Re-exported so existing importers (this screen's own tests, the public
// quiz route) don't need to know the types moved to shared/domain in
// Milestone 9 — see shared/domain/submission.ts for the canonical definition.
export type { AnswerMap, StudentAnswer };

export function createEmptyAnswers(questions: PublicQuestion[]): AnswerMap {
  const answers: AnswerMap = {};
  for (const question of questions) {
    if (question.type === 'multiple_choice') {
      answers[question.id] = { type: 'multiple_choice', value: null };
    } else if (question.type === 'true_false') {
      answers[question.id] = { type: 'true_false', value: null };
    } else {
      answers[question.id] = { type: 'short_answer', value: '' };
    }
  }
  return answers;
}

function isAnswered(answer: StudentAnswer | undefined): boolean {
  if (!answer) return false;
  if (answer.type === 'short_answer') return answer.value.trim().length > 0;
  return answer.value !== null;
}

export function areAllAnswered(questions: PublicQuestion[], answers: AnswerMap): boolean {
  return questions.every((question) => isAnswered(answers[question.id]));
}

export type QuestionResult = {
  questionId: string;
  // null: not auto-gradable (short_answer) — the student compares their own
  // answer to the expected one instead of relying on fuzzy text matching
  // (decision recorded in PROGRESS.md).
  isCorrect: boolean | null;
};

export type GradeSummary = {
  results: QuestionResult[];
  correctCount: number;
  // Count of auto-gradable questions (multiple_choice + true_false).
  // Short-answer questions are excluded from the score entirely rather than
  // silently graded wrong/right by an unreliable text match.
  gradableCount: number;
};

export function gradeQuiz(questions: PublicQuestion[], answers: AnswerMap): GradeSummary {
  const results = questions.map((question): QuestionResult => {
    const answer = answers[question.id];
    if (question.type === 'multiple_choice' && answer?.type === 'multiple_choice') {
      return { questionId: question.id, isCorrect: answer.value === question.correctAnswer };
    }
    if (question.type === 'true_false' && answer?.type === 'true_false') {
      return { questionId: question.id, isCorrect: answer.value === question.correctAnswer };
    }
    return { questionId: question.id, isCorrect: null };
  });

  const gradable = results.filter((result) => result.isCorrect !== null);
  const correctCount = gradable.filter((result) => result.isCorrect).length;

  return { results, correctCount, gradableCount: gradable.length };
}
