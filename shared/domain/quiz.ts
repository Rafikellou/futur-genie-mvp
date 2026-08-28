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
// own type. Every question type is auto-gradable — a quiz's score is always
// "correct / total", which keeps per-student and per-question stats simple.
export type QuestionType = 'multiple_choice' | 'true_false' | 'gap_fill' | 'matching';

// The placeholder that marks the blank in a `gap_fill` question's sentence.
// The student picks the word/number that belongs there from `choices`.
export const BLANK_MARKER = '____';

// Fields every question type shares. `sourceEvidence` is internal quality
// metadata (CLAUDE.md §23) — the app must never render it to students, and
// the public quiz payload (Milestone 7) must strip it before publication.
//
// `explanation`/`sourceEvidence` allow an empty string: a teacher can add a
// question by hand in the review screen (Milestone 6), and such a question
// has no AI-authored explanation or source evidence. The AI output contract
// stays strict independently — the generate-quiz Edge Function validates the
// model against its own `WireQuestionSchema` (min(1) on both) before this
// schema ever sees the data.
const baseQuestionShape = {
  id: z.string().min(1),
  question: z.string().min(1),
  explanation: z.string(),
  sourceEvidence: z.string(),
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

// "Texte à trous": a sentence with exactly one blank (written as BLANK_MARKER),
// completed by picking the right word/number among 2–4 choices. Graded exactly
// like a multiple-choice question.
export const GapFillQuestionSchema = z.object({
  ...baseQuestionShape,
  type: z.literal('gap_fill'),
  choices: z.array(z.string().min(1)).min(2).max(4),
  correctAnswer: z.string().min(1),
});

// "Reliez les paires": the student matches each left item to its right item.
// The `pairs` list is itself the answer key. Scored all-or-nothing — the
// question counts correct only if every pair is matched right — so it still
// contributes exactly one point, keeping the "correct / total" score model.
const MatchingPairSchema = z.object({
  left: z.string().min(1),
  right: z.string().min(1),
});

export const MatchingQuestionSchema = z.object({
  ...baseQuestionShape,
  type: z.literal('matching'),
  pairs: z.array(MatchingPairSchema).min(2).max(4),
});

// Shared invariants that a discriminated union can't express on its own
// (a member carrying `.refine` is no longer a plain object schema). Mirrored
// by QuestionSchema and PublicQuestionSchema below.
type QuestionInvariantInput = {
  type: string;
  question: string;
  choices?: string[];
  correctAnswer?: string | boolean;
  pairs?: { left: string; right: string }[];
};

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

function questionInvariantIssue(q: QuestionInvariantInput): { message: string; path: string[] } | null {
  if (q.type === 'multiple_choice' || q.type === 'gap_fill') {
    if (typeof q.correctAnswer !== 'string' || !q.choices?.includes(q.correctAnswer)) {
      return { message: 'correctAnswer must be one of choices', path: ['correctAnswer'] };
    }
  }
  if (q.type === 'gap_fill' && !q.question.includes(BLANK_MARKER)) {
    return { message: `gap_fill question must contain the blank marker "${BLANK_MARKER}"`, path: ['question'] };
  }
  if (q.type === 'matching' && q.pairs) {
    // Both sides must be distinct: the student picks a right label per left
    // item, and grading matches by label (here and in submit_quiz_answers).
    if (hasDuplicates(q.pairs.map((p) => p.left)) || hasDuplicates(q.pairs.map((p) => p.right))) {
      return { message: 'matching pairs must have distinct left and right values', path: ['pairs'] };
    }
  }
  return null;
}

export const QuestionSchema = z
  .discriminatedUnion('type', [
    MultipleChoiceQuestionSchema,
    TrueFalseQuestionSchema,
    GapFillQuestionSchema,
    MatchingQuestionSchema,
  ])
  .superRefine((q, ctx) => {
    const issue = questionInvariantIssue(q);
    if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message, path: issue.path });
  });

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;
export type GapFillQuestion = z.infer<typeof GapFillQuestionSchema>;
export type MatchingQuestion = z.infer<typeof MatchingQuestionSchema>;
export type MatchingPair = z.infer<typeof MatchingPairSchema>;
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

// Public counterpart of QuestionSchema/QuizDataSchema: identical shape minus
// `sourceEvidence`, which the publish RPC strips before a quiz becomes
// readable by anonymous students (CLAUDE.md §23/§29). Built via `.omit()`/
// `.extend()` on the schemas above rather than a hand-written duplicate, so
// the two shapes can never silently drift apart.
export const PublicQuestionSchema = z
  .discriminatedUnion('type', [
    MultipleChoiceQuestionSchema.omit({ sourceEvidence: true }),
    TrueFalseQuestionSchema.omit({ sourceEvidence: true }),
    GapFillQuestionSchema.omit({ sourceEvidence: true }),
    MatchingQuestionSchema.omit({ sourceEvidence: true }),
  ])
  .superRefine((q, ctx) => {
    const issue = questionInvariantIssue(q);
    if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message, path: issue.path });
  });

export type PublicQuestion = z.infer<typeof PublicQuestionSchema>;

export const PublicQuizDataSchema = QuizDataSchema.extend({
  questions: z.array(PublicQuestionSchema),
});

export type PublicQuizData = z.infer<typeof PublicQuizDataSchema>;
