// Deno tests for the generate-quiz pipeline's pure logic: prompt building
// and AI-response validation/normalization. No network call is made or
// mocked — see toQuizData/normalizeQuestion, which are plain functions.
// Run with: deno test supabase/functions/generate-quiz
import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@1';

import { buildTaskPrompt } from './prompt.ts';
import { AiQuizResponseSchema, toQuizData, type AiQuizResponse } from './aiResponse.ts';
import { GenerationError } from './errors.ts';

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
