import type { PublicQuestion } from '@shared/domain/quiz';
import { areAllAnswered, createEmptyAnswers, gradeQuiz, type AnswerMap } from './grading';

const mcQuestion: PublicQuestion = {
  id: 'q1',
  type: 'multiple_choice',
  question: 'Combien font 2 + 2 ?',
  explanation: '2 + 2 = 4.',
  choices: ['3', '4', '5'],
  correctAnswer: '4',
};

const tfQuestion: PublicQuestion = {
  id: 'q2',
  type: 'true_false',
  question: "L'eau gèle à 0 °C.",
  explanation: 'Vrai, sous pression atmosphérique normale.',
  correctAnswer: true,
};

const shortQuestion: PublicQuestion = {
  id: 'q3',
  type: 'short_answer',
  question: 'Quelle est la capitale de la France ?',
  explanation: 'Paris est la capitale de la France.',
  correctAnswer: 'Paris',
};

const questions: PublicQuestion[] = [mcQuestion, tfQuestion, shortQuestion];

describe('createEmptyAnswers', () => {
  it('creates one unanswered entry per question, matching its type', () => {
    const answers = createEmptyAnswers(questions);

    expect(answers).toEqual({
      q1: { type: 'multiple_choice', value: null },
      q2: { type: 'true_false', value: null },
      q3: { type: 'short_answer', value: '' },
    });
  });
});

describe('areAllAnswered', () => {
  it('is false when any question still has no answer', () => {
    const answers = createEmptyAnswers(questions);
    expect(areAllAnswered(questions, answers)).toBe(false);
  });

  it('treats a short answer of only whitespace as unanswered', () => {
    const answers: AnswerMap = {
      ...createEmptyAnswers(questions),
      q1: { type: 'multiple_choice', value: '4' },
      q2: { type: 'true_false', value: true },
      q3: { type: 'short_answer', value: '   ' },
    };
    expect(areAllAnswered(questions, answers)).toBe(false);
  });

  it('is true once every question has a real answer', () => {
    const answers: AnswerMap = {
      q1: { type: 'multiple_choice', value: '4' },
      q2: { type: 'true_false', value: true },
      q3: { type: 'short_answer', value: 'Paris' },
    };
    expect(areAllAnswered(questions, answers)).toBe(true);
  });
});

describe('gradeQuiz', () => {
  it('grades multiple_choice and true_false against correctAnswer', () => {
    const answers: AnswerMap = {
      q1: { type: 'multiple_choice', value: '4' },
      q2: { type: 'true_false', value: false },
      q3: { type: 'short_answer', value: 'Paris' },
    };

    const summary = gradeQuiz(questions, answers);

    expect(summary.results).toEqual([
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
      { questionId: 'q3', isCorrect: null },
    ]);
    expect(summary.correctCount).toBe(1);
    // Only the two auto-gradable questions count — the short answer is
    // excluded entirely rather than fuzzily matched (see comments in
    // grading.ts and PROGRESS.md "Correction élève").
    expect(summary.gradableCount).toBe(2);
  });

  it('never marks a short_answer question right or wrong, however it is phrased', () => {
    const answers: AnswerMap = {
      q1: { type: 'multiple_choice', value: '4' },
      q2: { type: 'true_false', value: true },
      q3: { type: 'short_answer', value: 'paris' },
    };

    const summary = gradeQuiz(questions, answers);
    const shortAnswerResult = summary.results.find((r) => r.questionId === 'q3');

    expect(shortAnswerResult?.isCorrect).toBeNull();
  });

  it('reports gradableCount 0 when a quiz is entirely short_answer questions', () => {
    const onlyShort = [shortQuestion];
    const answers: AnswerMap = { q3: { type: 'short_answer', value: 'Paris' } };

    const summary = gradeQuiz(onlyShort, answers);

    expect(summary.gradableCount).toBe(0);
    expect(summary.correctCount).toBe(0);
  });
});
