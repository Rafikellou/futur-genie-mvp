import {
  BLANK_MARKER,
  PublicQuizDataSchema,
  QuestionSchema,
  QuizDataSchema,
} from './quiz';

const baseQuiz = {
  title: 'Les états de l’eau',
  grade: 'CE2',
  subject: 'sciences',
  quizType: 'mixed',
  instructions: 'Réponds aux questions.',
  warnings: [],
};

const mc = {
  id: 'q1',
  type: 'multiple_choice',
  question: 'Température de gel ?',
  explanation: '',
  sourceEvidence: '',
  choices: ['0 °C', '100 °C'],
  correctAnswer: '0 °C',
};

const gap = {
  id: 'q2',
  type: 'gap_fill',
  question: `L'eau bout à ${BLANK_MARKER} °C.`,
  explanation: '',
  sourceEvidence: '',
  choices: ['0', '100'],
  correctAnswer: '100',
};

describe('QuestionSchema', () => {
  it('accepts a valid gap_fill question', () => {
    expect(QuestionSchema.safeParse(gap).success).toBe(true);
  });

  it('rejects a gap_fill question with no blank marker', () => {
    expect(QuestionSchema.safeParse({ ...gap, question: 'Pas de trou ici.' }).success).toBe(false);
  });

  it('rejects a gap_fill question whose correctAnswer is not a choice', () => {
    expect(QuestionSchema.safeParse({ ...gap, correctAnswer: '50' }).success).toBe(false);
  });

  it('no longer accepts the removed short_answer type', () => {
    const short = { ...mc, type: 'short_answer', choices: undefined };
    expect(QuestionSchema.safeParse(short).success).toBe(false);
  });
});

describe('QuizDataSchema / PublicQuizDataSchema', () => {
  it('accepts a mixed quiz containing every question type', () => {
    const quiz = { ...baseQuiz, questions: [mc, gap] };
    expect(QuizDataSchema.safeParse(quiz).success).toBe(true);
  });

  it('parses the same quiz through the public schema (sourceEvidence stripped)', () => {
    const strip = (q: Record<string, unknown>) => {
      const { sourceEvidence, ...rest } = q;
      void sourceEvidence;
      return rest;
    };
    const quiz = { ...baseQuiz, questions: [mc, gap].map(strip) };
    expect(PublicQuizDataSchema.safeParse(quiz).success).toBe(true);
  });
});
