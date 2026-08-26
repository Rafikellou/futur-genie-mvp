import { buildPublicQuizUrl } from '@/features/quiz-publishing/publicQuizUrl';

// A published quiz's minimal shape needed to compose a share message —
// deliberately narrower than the my-quizzes row type so this stays reusable
// (e.g. by a future single-quiz share) without depending on screen state.
export type ShareableQuiz = {
  title: string;
  publicSlug: string;
};

// Builds one teacher-editable text message: a short greeting followed by
// every selected quiz as a numbered "title" + public link. Kept as a pure
// function (no React, no I/O) so it's trivial to unit test — see
// composeShareText.test.ts. The teacher can still edit the result before
// sending it (CLAUDE.md §3), so this default wording only needs to be a
// reasonable starting point, not final copy.
export function composeShareText(quizzes: ShareableQuiz[]): string {
  if (quizzes.length === 0) return '';

  const intro = 'Bonjour, veuillez trouver ci-dessous les devoirs du jour :';
  const items = quizzes
    .map(
      (quiz, index) => `${index + 1}. ${quiz.title}\n${buildPublicQuizUrl(quiz.publicSlug)}`,
    )
    .join('\n\n');

  return `${intro}\n\n${items}`;
}
