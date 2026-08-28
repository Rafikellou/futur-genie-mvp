// Validates and normalizes the model's structured output into the shared
// QuizData domain shape. Nothing here trusts the model: every field is
// checked, and any inconsistency is treated as invalid_ai_output rather
// than silently accepted (CLAUDE.md §22/§24).
import { z } from 'zod';

import { BLANK_MARKER, QuizDataSchema, type QuizData } from '../../../shared/domain/quiz.ts';
import { LESSON_MODES, type LessonMode } from '../../../shared/domain/lessonMode.ts';
import { GenerationError } from './errors.ts';

// Exact shape requested from the model via OpenAI's structured output — see
// the `RESPONSE_JSON_SCHEMA` in openai.ts, which must stay in sync with
// this. Every property is always present; fields that don't apply to a
// question type are `null` rather than omitted, because OpenAI's strict
// structured-output mode requires every declared property to be present.
export const WireQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'gap_fill', 'matching']),
  // For gap_fill: the sentence to complete, containing the blank written as
  // "____" (BLANK_MARKER).
  question: z.string().min(1),
  explanation: z.string().min(1),
  sourceEvidence: z.string().min(1),
  // multiple_choice / gap_fill: the list of choices. null for true_false and
  // matching.
  choices: z.array(z.string().min(1)).nullable(),
  // multiple_choice / gap_fill: the answer text (one of `choices`).
  // true_false: the French literal "vrai" or "faux".
  // matching: empty (the answer key is `pairs`). Not `.min(1)` for that reason
  // — normalizeQuestion enforces the real per-type rules.
  correctAnswer: z.string(),
  // matching only: the left/right pairs that are the answer key. null otherwise.
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .nullable(),
});

export type WireQuestion = z.infer<typeof WireQuestionSchema>;

export const AiQuizResponseSchema = z.object({
  // Reported by the model itself rather than inferred from question count
  // (CLAUDE.md §20/§24) — an empty `questions` array is expected whenever
  // either flag is false.
  readable: z.boolean(),
  sufficientContent: z.boolean(),
  // How the model chose to test the lesson (rule application vs. recall).
  // Surfaced to the teacher on the review screen as a plain-French sentence;
  // never persisted or published (CLAUDE.md §23) — see shared/domain/lessonMode.
  lessonMode: z.enum(LESSON_MODES as [LessonMode, ...LessonMode[]]),
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
    case 'gap_fill': {
      if (
        !wire.choices ||
        wire.choices.length < 2 ||
        wire.choices.length > 4 ||
        !wire.choices.includes(wire.correctAnswer)
      ) {
        throw new GenerationError(
          'invalid_ai_output',
          'gap_fill question missing 2-4 choices including correctAnswer'
        );
      }
      if (!wire.question.includes(BLANK_MARKER)) {
        throw new GenerationError(
          'invalid_ai_output',
          `gap_fill question must contain the blank marker "${BLANK_MARKER}"`
        );
      }
      return {
        type: 'gap_fill' as const,
        question: wire.question,
        explanation: wire.explanation,
        sourceEvidence: wire.sourceEvidence,
        choices: wire.choices,
        correctAnswer: wire.correctAnswer,
      };
    }
    case 'matching': {
      const pairs = wire.pairs ?? [];
      const lefts = pairs.map((p) => p.left);
      const rights = pairs.map((p) => p.right);
      if (
        pairs.length < 2 ||
        pairs.length > 4 ||
        new Set(lefts).size !== lefts.length ||
        new Set(rights).size !== rights.length
      ) {
        throw new GenerationError(
          'invalid_ai_output',
          'matching question needs 2-4 pairs with distinct left and right values'
        );
      }
      return {
        type: 'matching' as const,
        question: wire.question,
        explanation: wire.explanation,
        sourceEvidence: wire.sourceEvidence,
        pairs,
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
