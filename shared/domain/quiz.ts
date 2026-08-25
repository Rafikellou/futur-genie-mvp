// Quiz draft produced by AI generation (Milestone 5) and later edited
// (Milestone 6) / persisted (Milestone 7). Centralized so the Edge Function
// (validating the AI's structured output) and the app (rendering/editing)
// share one definition — see CLAUDE.md §22, §46.
import { z } from 'zod';

// Explicit ".ts" extensions: this file is imported both by Metro (this app)
// and by the generate-quiz Edge Function under Deno, which requires
// extensions on relative/local specifiers.
import { GRADES } from './grade.ts';
import { SUBJECTS } from './subject.ts';
import { EXERCISE_TYPES } from './exercise.ts';

const GRADE_VALUES = GRADES.map((g) => g.value) as [string, ...string[]];
const SUBJECT_VALUES = SUBJECTS.map((s) => s.value) as [string, ...string[]];
const QUIZ_TYPE_VALUES = EXERCISE_TYPES.map((t) => t.value) as [string, ...string[]];

// Per-question type. Distinct from `QuizType` (shared/domain/exercise.ts):
// "mixed" is a request-level composition choice, never a single question's
// own type.
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

// Fields every question type shares. `sourceEvidence` is internal quality
// metadata (CLAUDE.md §23) — the app must never render it to students, and
// the public quiz payload (Milestone 7) must strip it before publication.
const baseQuestionShape = {
  id: z.string().min(1),
  question: z.string().min(1),
  explanation: z.string().min(1),
  sourceEvidence: z.string().min(1),
};

export const MultipleChoiceQuestionSchema = z.object({
  ...baseQuestionShape,
  type: z.literal('multiple_choice'),
  choices: z.array(z.string().min(1)).min(2).max(6),
  correctAnswer: z.string().min(1),
});

export const TrueFalseQuestionSchema = z.object({
  ...baseQuestionShape,
  type: z.literal('true_false'),
  correctAnswer: z.boolean(),
});

export const ShortAnswerQuestionSchema = z.object({
  ...baseQuestionShape,
  type: z.literal('short_answer'),
  correctAnswer: z.string().min(1),
});

export const QuestionSchema = z
  .discriminatedUnion('type', [
    MultipleChoiceQuestionSchema,
    TrueFalseQuestionSchema,
    ShortAnswerQuestionSchema,
  ])
  .refine((q) => q.type !== 'multiple_choice' || q.choices.includes(q.correctAnswer), {
    message: 'correctAnswer must be one of choices',
    path: ['correctAnswer'],
  });

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;
export type ShortAnswerQuestion = z.infer<typeof ShortAnswerQuestionSchema>;
export type Question = z.infer<typeof QuestionSchema>;

export const QuizDataSchema = z.object({
  title: z.string().min(1),
  grade: z.enum(GRADE_VALUES),
  subject: z.enum(SUBJECT_VALUES),
  quizType: z.enum(QUIZ_TYPE_VALUES),
  instructions: z.string().min(1),
  // A lesson too thin to support the requested count yields fewer
  // questions plus a warning, rather than invented content (CLAUDE.md §20).
  // Zero is valid: a fully unreadable/insufficient lesson still returns a
  // well-formed QuizData with warnings instead of a raw error, wherever the
  // caller wants to display "why" alongside "what to do next".
  questions: z.array(QuestionSchema),
  // Teacher-facing, French, jargon-free (CLAUDE.md §34). Empty when nothing
  // needs flagging.
  warnings: z.array(z.string()),
});

export type QuizData = z.infer<typeof QuizDataSchema>;
