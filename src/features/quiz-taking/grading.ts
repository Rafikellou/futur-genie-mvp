// Pure, dependency-free grading logic for the public quiz route
// (src/app/q/[slug].tsx). Kept separate from the screen so the rules are
// easy to read and reason about on their own — no React, no Supabase.
//
// Correction is entirely client-side: the correct answer already lives in
// `public_quiz_data` (only hidden in the UI until submission). This is a
// deliberate MVP tradeoff recorded in PROGRESS.md ("Correction élève") —
// the submission row's score is still recomputed server-side by
// submit_quiz_answers() (CLAUDE.md §48).
//
// Every question type is auto-gradable, so `gradableCount` always equals the
// number of questions — a quiz score is simply "correct / total". A matching
// question is scored all-or-nothing (every pair right, or the question is
// wrong), so it too is worth exactly one point.
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
    } else if (question.type === 'gap_fill') {
      answers[question.id] = { type: 'gap_fill', value: null };
    } else if (question.type === 'matching') {
      answers[question.id] = { type: 'matching', value: {} };
    } else {
      answers[question.id] = { type: 'true_false', value: null };
    }
  }
  return answers;
}

function isAnswered(question: PublicQuestion, answer: StudentAnswer | undefined): boolean {
  if (!answer) return false;
  if (question.type === 'matching' && answer.type === 'matching') {
    return question.pairs.every((_, index) => Boolean(answer.value[String(index)]));
  }
  if (answer.type === 'matching') return false;
  return answer.value !== null;
}

export function areAllAnswered(questions: PublicQuestion[], answers: AnswerMap): boolean {
  return questions.every((question) => isAnswered(question, answers[question.id]));
}

export type QuestionResult = {
  questionId: string;
  isCorrect: boolean;
};

export type GradeSummary = {
  results: QuestionResult[];
  correctCount: number;
  // Always equal to the number of questions: every supported question type
  // is auto-gradable.
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
    if (question.type === 'gap_fill' && answer?.type === 'gap_fill') {
      return { questionId: question.id, isCorrect: answer.value === question.correctAnswer };
    }
    if (question.type === 'matching' && answer?.type === 'matching') {
      const allPairsRight = question.pairs.every(
        (pair, index) => answer.value[String(index)] === pair.right,
      );
      return { questionId: question.id, isCorrect: allPairsRight };
    }
    return { questionId: question.id, isCorrect: false };
  });

  const correctCount = results.filter((result) => result.isCorrect).length;

  return { results, correctCount, gradableCount: results.length };
}
