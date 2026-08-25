// Validates and normalizes the model's structured output into the shared
// QuizData domain shape. Nothing here trusts the model: every field is
// checked, and any inconsistency is treated as invalid_ai_output rather
// than silently accepted (CLAUDE.md §22/§24).
import { z } from 'zod';

import { QuizDataSchema, type QuizData } from '../../../shared/domain/quiz.ts';
import { GenerationError } from './errors.ts';

// Exact shape requested from the model via OpenAI's structured output — see
// the `RESPONSE_JSON_SCHEMA` in openai.ts, which must stay in sync with
// this. Every property is always present; fields that don't apply to a
// question type are `null` rather than omitted, because OpenAI's strict
// structured-output mode requires every declared property to be present.
export const WireQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  question: z.string().min(1),
  explanation: z.string().min(1),
  sourceEvidence: z.string().min(1),
  // multiple_choice only; null otherwise.
  choices: z.array(z.string().min(1)).nullable(),
  // multiple_choice/short_answer: the answer text. true_false: the French
  // literal "vrai" or "faux" — kept as a plain string so every wire field
  // has a single JSON type (see prompt.ts rule 8).
  correctAnswer: z.string().min(1),
});

export type WireQuestion = z.infer<typeof WireQuestionSchema>;

export const AiQuizResponseSchema = z.object({
  // Reported by the model itself rather than inferred from question count
  // (CLAUDE.md §20/§24) — an empty `questions` array is expected whenever
  // either flag is false.
  readable: z.boolean(),
  sufficientContent: z.boolean(),
  title: z.string().min(1),
  instructions: z.string().min(1),
  questions: z.array(WireQuestionSchema),
  warnings: z.array(z.string()),
});

export type AiQuizResponse = z.infer<typeof AiQuizResponseSchema>;

// Converts one wire-format question into the shared domain shape (still
// without `id` — assigned once, for the whole quiz, in toQuizData). Throws
// GenerationError('invalid_ai_output') for an internally inconsistent
// question (e.g. a multiple_choice with no matching choices, or a
// true_false answer that isn't "vrai"/"faux").
function normalizeQuestion(wire: WireQuestion) {
  switch (wire.type) {
    case 'multiple_choice': {
      if (!wire.choices || wire.choices.length < 2 || !wire.choices.includes(wire.correctAnswer)) {
        throw new GenerationError(
          'invalid_ai_output',
          'multiple_choice question missing valid choices/correctAnswer'
        );
      }
      return {
        type: 'multiple_choice' as const,
        question: wire.question,
        explanation: wire.explanation,
        sourceEvidence: wire.sourceEvidence,
        choices: wire.choices,
        correctAnswer: wire.correctAnswer,
      };
    }
    case 'true_false': {
      const normalized = wire.correctAnswer.trim().toLowerCase();
      if (normalized !== 'vrai' && normalized !== 'faux') {
        throw new GenerationError(
          'invalid_ai_output',
          'true_false correctAnswer must be "vrai" or "faux"'
        );
      }
      return {
        type: 'true_false' as const,
        question: wire.question,
        explanation: wire.explanation,
        sourceEvidence: wire.sourceEvidence,
        correctAnswer: normalized === 'vrai',
      };
    }
    case 'short_answer': {
      return {
        type: 'short_answer' as const,
        question: wire.question,
        explanation: wire.explanation,
        sourceEvidence: wire.sourceEvidence,
        correctAnswer: wire.correctAnswer,
      };
    }
  }
}

type RequestParams = {
  grade: QuizData['grade'];
  subject: QuizData['subject'];
  quizType: QuizData['quizType'];
};

// Assigns stable ids and fills in the request-derived fields the model
// never produces: grade/subject/quizType come from the already-validated
// request, never from the model, so a hallucinated echo can't override
// them. Callers must check `readable`/`sufficientContent` before calling
// this — see index.ts.
export function toQuizData(raw: AiQuizResponse, request: RequestParams): QuizData {
  try {
    const questions = raw.questions.map((wire, index) => ({
      ...normalizeQuestion(wire),
      id: `q${index + 1}`,
    }));

    return QuizDataSchema.parse({
      title: raw.title,
      grade: request.grade,
      subject: request.subject,
      quizType: request.quizType,
      instructions: raw.instructions,
      warnings: raw.warnings,
      questions,
    });
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    throw new GenerationError('invalid_ai_output', String(err));
  }
}
