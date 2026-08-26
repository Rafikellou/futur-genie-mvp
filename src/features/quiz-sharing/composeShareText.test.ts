import { composeShareText, type ShareableQuiz } from './composeShareText';

describe('composeShareText', () => {
  it('greets, then lists a single quiz as "1. title" followed by its public link', () => {
    const quizzes: ShareableQuiz[] = [{ title: 'Les états de l’eau', publicSlug: 'abc123' }];

    const text = composeShareText(quizzes);

    expect(text).toBe(
      'Bonjour, veuillez trouver ci-dessous les devoirs du jour :\n\n1. Les états de l’eau\n/q/abc123',
    );
  });

  it('numbers several quizzes in the given order, each with its own title and link', () => {
    const quizzes: ShareableQuiz[] = [
      { title: 'Sciences', publicSlug: 'sci01' },
      { title: 'Mathématiques', publicSlug: 'math02' },
      { title: 'Histoire', publicSlug: 'hist03' },
    ];

    const text = composeShareText(quizzes);

    const intro = 'Bonjour, veuillez trouver ci-dessous les devoirs du jour :';
    const items = ['1. Sciences\n/q/sci01', '2. Mathématiques\n/q/math02', '3. Histoire\n/q/hist03'].join(
      '\n\n',
    );
    expect(text).toBe(`${intro}\n\n${items}`);
  });

  it('returns an empty string for an empty selection', () => {
    expect(composeShareText([])).toBe('');
  });
});
