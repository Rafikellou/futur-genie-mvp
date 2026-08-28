// Deno tests for the generate-quiz pipeline's pure logic: prompt building
// and AI-response validation/normalization. No network call is made or
// mocked — see toQuizData/normalizeQuestion, which are plain functions.
// Run with: deno test supabase/functions/generate-quiz
import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@1';

import { buildTaskPrompt } from './prompt.ts';
import { AiQuizResponseSchema, toQuizData, type AiQuizResponse } from './aiResponse.ts';
import { GenerationError } from './errors.ts';
import { hasWrongArithmeticAnswer, stripWrongArithmetic } from './checkArithmetic.ts';
import type { QuizData } from '../../../shared/domain/quiz.ts';

Deno.test('buildTaskPrompt includes the teacher-selected parameters', () => {
  const prompt = buildTaskPrompt({
    grade: 'CE2',
    subject: 'sciences',
    quizType: 'mixed',
    questionCount: 10,
  });

  assert(prompt.includes('CE2'));
  assert(prompt.includes('Sciences'));
  assert(prompt.includes('10'));
  assert(prompt.includes('mixed'));
});

Deno.test('buildTaskPrompt injects the calibration notes for the requested grade only', () => {
  const ce2 = buildTaskPrompt({ grade: 'CE2', subject: 'mathematiques', quizType: 'short_answer', questionCount: 10 });
  assert(ce2.includes('Calibration notes for CE2'));
  // A concrete CE2 anchor from the card, and nothing from another grade's card.
  assert(ce2.includes('10 000'));
  assert(!ce2.includes('Calibration notes for CM2'));

  const cp = buildTaskPrompt({ grade: 'CP', subject: 'francais', quizType: 'true_false', questionCount: 5 });
  assert(cp.includes('Calibration notes for CP'));
  assert(cp.includes('~6 years old'));
});

Deno.test('buildTaskPrompt bounds a teacher instruction instead of merging it silently', () => {
  const prompt = buildTaskPrompt({
    grade: 'CM2',
    subject: 'histoire',
    quizType: 'short_answer',
    questionCount: 5,
    teacherInstruction: 'Insiste sur les dates.',
  });

  assert(prompt.includes('"""Insiste sur les dates."""'));
  assert(prompt.includes('ignore any part of it'));
});

Deno.test('buildTaskPrompt omits the teacher-instruction section when absent', () => {
  const prompt = buildTaskPrompt({
    grade: 'CP',
    subject: 'francais',
    quizType: 'true_false',
    questionCount: 5,
  });

  assert(!prompt.includes('teacher additionally asked'));
});

function validAiResponse(): AiQuizResponse {
  return AiQuizResponseSchema.parse({
    readable: true,
    sufficientContent: true,
    lessonMode: 'factual',
    title: "Les états de l'eau",
    instructions: 'Réponds aux questions suivantes.',
    warnings: [],
    questions: [
      {
        type: 'multiple_choice',
        question: "À quelle température l'eau gèle-t-elle ?",
        explanation: "La leçon indique que l'eau devient solide à 0 °C.",
        sourceEvidence: "L'eau devient solide à 0 °C.",
        choices: ['0 °C', '10 °C', '100 °C'],
        correctAnswer: '0 °C',
      },
      {
        type: 'true_false',
        question: "L'eau bout à 100 °C.",
        explanation: 'La leçon indique que l’eau bout à 100 °C.',
        sourceEvidence: "L'eau devient gazeuse (elle bout) à 100 °C.",
        choices: null,
        correctAnswer: 'vrai',
      },
      {
        type: 'short_answer',
        question: "Comment s'appelle l'état gazeux de l'eau ?",
        explanation: 'La leçon nomme cet état "vapeur d’eau".',
        sourceEvidence: "À l'état gazeux, l'eau est appelée vapeur d'eau.",
        choices: null,
        correctAnswer: "vapeur d'eau",
      },
    ],
  });
}

Deno.test('toQuizData assigns sequential ids and takes grade/subject/quizType from the request', () => {
  const quiz = toQuizData(validAiResponse(), {
    grade: 'CE2',
    subject: 'sciences',
    quizType: 'mixed',
  });

  assertEquals(quiz.grade, 'CE2');
  assertEquals(quiz.subject, 'sciences');
  assertEquals(quiz.quizType, 'mixed');
  assertEquals(
    quiz.questions.map((q) => q.id),
    ['q1', 'q2', 'q3']
  );
});

Deno.test('toQuizData converts a true_false "vrai"/"faux" answer to a boolean', () => {
  const quiz = toQuizData(validAiResponse(), {
    grade: 'CE2',
    subject: 'sciences',
    quizType: 'mixed',
  });

  const trueFalse = quiz.questions[1];
  assert(trueFalse.type === 'true_false');
  assertEquals(trueFalse.correctAnswer, true);
});

Deno.test('toQuizData rejects a multiple_choice question whose correctAnswer is not among its choices', () => {
  const raw = validAiResponse();
  raw.questions[0] = { ...raw.questions[0], correctAnswer: '20 °C' };

  const err = assertThrows(
    () => toQuizData(raw, { grade: 'CE2', subject: 'sciences', quizType: 'mixed' }),
    GenerationError
  );
  assertEquals(err.code, 'invalid_ai_output');
});

Deno.test('toQuizData rejects a true_false answer that is not "vrai"/"faux"', () => {
  const raw = validAiResponse();
  raw.questions[1] = { ...raw.questions[1], correctAnswer: 'oui' };

  const err = assertThrows(
    () => toQuizData(raw, { grade: 'CE2', subject: 'sciences', quizType: 'mixed' }),
    GenerationError
  );
  assertEquals(err.code, 'invalid_ai_output');
});

Deno.test('AiQuizResponseSchema rejects a payload missing the readability flags', () => {
  const result = AiQuizResponseSchema.safeParse({
    lessonMode: 'factual',
    title: 'x',
    instructions: 'x',
    warnings: [],
    questions: [],
  });
  assertEquals(result.success, false);
});

Deno.test('AiQuizResponseSchema rejects an unknown lessonMode', () => {
  const result = AiQuizResponseSchema.safeParse({
    readable: true,
    sufficientContent: true,
    lessonMode: 'memorisation',
    title: 'x',
    instructions: 'x',
    warnings: [],
    questions: [],
  });
  assertEquals(result.success, false);
});

Deno.test('a lesson reported as unreadable carries no questions to validate', () => {
  const raw = AiQuizResponseSchema.parse({
    readable: false,
    sufficientContent: false,
    lessonMode: 'factual',
    title: '',
    instructions: '',
    warnings: ['Photo illisible.'],
    questions: [],
  });
  // index.ts short-circuits on `readable`/`sufficientContent` before ever
  // calling toQuizData — this only documents the shape it must handle.
  assertEquals(raw.readable, false);
  assertEquals(raw.questions.length, 0);
});

Deno.test('hasWrongArithmeticAnswer flags a plainly wrong sum and clears a correct one', () => {
  assert(hasWrongArithmeticAnswer('Combien font 47 + 36 ?', '73'));
  assert(!hasWrongArithmeticAnswer('Combien font 47 + 36 ?', '83'));
  assert(hasWrongArithmeticAnswer('128 − 45 = ?', '93'));
  assert(!hasWrongArithmeticAnswer('128 − 45 = ?', '83'));
  assert(hasWrongArithmeticAnswer('Calcule 6 × 7.', '42 bonbons') === false); // answer not a clean number
  assert(!hasWrongArithmeticAnswer('Calcule 6 × 7.', '42'));
});

Deno.test('hasWrongArithmeticAnswer stays out of anything ambiguous', () => {
  // Two calculations in one question — cannot tell which the answer is for.
  assert(!hasWrongArithmeticAnswer('Compare 2 + 3 et 4 + 1.', '5'));
  // A range, not a subtraction.
  assert(!hasWrongArithmeticAnswer('Écris les nombres de 10 à 20.', '11'));
  // Non-numeric answer.
  assert(!hasWrongArithmeticAnswer('Combien font 2 + 2 ?', 'quatre'));
  // Numbers with a space thousands separator are still read correctly.
  assert(hasWrongArithmeticAnswer('1 200 + 300 = ?', '1 400'));
});

function mathQuiz(questions: QuizData['questions']): QuizData {
  return {
    title: 'Additions',
    grade: 'CE2',
    subject: 'mathematiques',
    quizType: 'short_answer',
    instructions: 'Calcule.',
    warnings: [],
    questions,
  };
}

Deno.test('stripWrongArithmetic removes only the wrong question and adds one warning', () => {
  const quiz = stripWrongArithmetic(
    mathQuiz([
      { id: 'q1', type: 'short_answer', question: '12 + 9 = ?', explanation: '', sourceEvidence: '', correctAnswer: '21' },
      { id: 'q2', type: 'short_answer', question: '25 + 25 = ?', explanation: '', sourceEvidence: '', correctAnswer: '40' },
    ])
  );
  assertEquals(quiz.questions.map((q) => q.id), ['q1']);
  assertEquals(quiz.warnings.length, 1);
});

Deno.test('stripWrongArithmetic leaves non-mathematics quizzes untouched', () => {
  const quiz = mathQuiz([
    { id: 'q1', type: 'short_answer', question: '2 + 2 = ?', explanation: '', sourceEvidence: '', correctAnswer: '5' },
  ]);
  quiz.subject = 'francais';
  assertEquals(stripWrongArithmetic(quiz).questions.length, 1);
});
