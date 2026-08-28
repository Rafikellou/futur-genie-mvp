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

const gapQuestion: PublicQuestion = {
  id: 'q3',
  type: 'gap_fill',
  question: "L'eau bout à ____ °C.",
  explanation: "L'eau bout à 100 °C.",
  choices: ['0', '50', '100'],
  correctAnswer: '100',
};

const questions: PublicQuestion[] = [mcQuestion, tfQuestion, gapQuestion];

describe('createEmptyAnswers', () => {
  it('creates one unanswered entry per question, matching its type', () => {
    const answers = createEmptyAnswers(questions);

    expect(answers).toEqual({
      q1: { type: 'multiple_choice', value: null },
      q2: { type: 'true_false', value: null },
      q3: { type: 'gap_fill', value: null },
    });
  });
});

describe('areAllAnswered', () => {
  it('is false when any question still has no answer', () => {
    const answers = createEmptyAnswers(questions);
    expect(areAllAnswered(questions, answers)).toBe(false);
  });

  it('is true once every question has a real answer', () => {
    const answers: AnswerMap = {
      q1: { type: 'multiple_choice', value: '4' },
      q2: { type: 'true_false', value: true },
      q3: { type: 'gap_fill', value: '100' },
    };
    expect(areAllAnswered(questions, answers)).toBe(true);
  });
});

describe('gradeQuiz', () => {
  it('grades every question type against correctAnswer', () => {
    const answers: AnswerMap = {
      q1: { type: 'multiple_choice', value: '4' },
      q2: { type: 'true_false', value: false },
      q3: { type: 'gap_fill', value: '100' },
    };

    const summary = gradeQuiz(questions, answers);

    expect(summary.results).toEqual([
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
      { questionId: 'q3', isCorrect: true },
    ]);
    expect(summary.correctCount).toBe(2);
    // Every question type is auto-gradable, so gradableCount is always the
    // question count — a quiz score is simply "correct / total".
    expect(summary.gradableCount).toBe(3);
  });

  it('counts an unanswered or mismatched entry as wrong rather than skipping it', () => {
    const answers: AnswerMap = {
      q1: { type: 'multiple_choice', value: null },
      q2: { type: 'true_false', value: true },
      q3: { type: 'gap_fill', value: '0' },
    };

    const summary = gradeQuiz(questions, answers);

    expect(summary.results.map((r) => r.isCorrect)).toEqual([false, true, false]);
    expect(summary.correctCount).toBe(1);
    expect(summary.gradableCount).toBe(3);
  });
});
