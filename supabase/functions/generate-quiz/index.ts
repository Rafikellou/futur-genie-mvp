// Edge Function: generate-quiz
//
// Authenticated teachers only. Takes a lesson photo (base64) plus exercise
// parameters, calls the multimodal LLM, validates its structured output,
// and returns a QuizData draft. Never persists the image or the quiz —
// draft persistence arrives with publishing (Milestone 7). See CLAUDE.md §15
// Milestone 5 and §31 (image lifecycle).
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { GRADES, type Grade } from '../../../shared/domain/grade.ts';
import { SUBJECTS, type Subject } from '../../../shared/domain/subject.ts';
import { EXERCISE_TYPES, QUESTION_COUNT_OPTIONS, type QuizType } from '../../../shared/domain/exercise.ts';
import type { GenerationErrorCode } from '../../../shared/domain/generationErrors.ts';

import { GenerationError, statusForErrorCode } from './errors.ts';
import { generateQuizFromLesson } from './openai.ts';
import { toQuizData } from './aiResponse.ts';
import { stripWrongArithmetic } from './checkArithmetic.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GRADE_VALUES = GRADES.map((g) => g.value) as [Grade, ...Grade[]];
const SUBJECT_VALUES = SUBJECTS.map((s) => s.value) as [Subject, ...Subject[]];
const QUIZ_TYPE_VALUES = EXERCISE_TYPES.map((t) => t.value) as [QuizType, ...QuizType[]];

// A phone photo compressed client-side (Milestone 4) lands well under 1 MB;
// this generously bounds abuse/mistaken payloads without touching normal use.
const MAX_BASE64_LENGTH = 8_000_000;

const RequestBodySchema = z.object({
  image: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.enum(['image/jpeg', 'image/png']),
  grade: z.enum(GRADE_VALUES),
  subject: z.enum(SUBJECT_VALUES),
  quizType: z.enum(QUIZ_TYPE_VALUES),
  // Only the presets the create-exercise screen offers (CLAUDE.md §46: one
  // shared definition) — never an arbitrary client-supplied count.
  questionCount: z.number().int().refine((n) => QUESTION_COUNT_OPTIONS.includes(n)),
  teacherInstruction: z.string().max(500).optional(),
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: GenerationErrorCode): Response {
  return jsonResponse(statusForErrorCode(code), { error: { code } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return errorResponse('invalid_request');
  }

  // Derive the caller's identity from their Supabase session — never trust
  // a teacher id supplied in the request body (CLAUDE.md §48).
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return errorResponse('unauthorized');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('generate-quiz: SUPABASE_URL/SUPABASE_ANON_KEY not configured');
    return errorResponse('unknown_error');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return errorResponse('unauthorized');
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse('invalid_request');
  }

  const parsed = RequestBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse('invalid_request');
  }
  const { image, mimeType, grade, subject, quizType, questionCount, teacherInstruction } =
    parsed.data;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.error('generate-quiz: OPENAI_API_KEY is not configured');
    return errorResponse('unknown_error');
  }

  const startedAt = Date.now();
  try {
    const aiResponse = await generateQuizFromLesson(
      { imageBase64: image, mimeType, grade, subject, quizType, questionCount, teacherInstruction },
      apiKey
    );

    // The model reports readability/sufficiency itself rather than the
    // backend guessing from question count (CLAUDE.md §20/§24).
    if (!aiResponse.readable) return errorResponse('unreadable_image');
    if (!aiResponse.sufficientContent) return errorResponse('insufficient_content');
    // Internally inconsistent: the model vouched for the lesson but still
    // produced nothing usable. Treat as a bad generation rather than
    // handing the teacher an empty quiz.
    if (aiResponse.questions.length === 0) return errorResponse('invalid_ai_output');

    // Deterministic post-check: drop any question whose arithmetic is
    // provably wrong before the teacher ever sees it (CLAUDE.md §26). Only
    // acts on mathematics quizzes and only on unambiguous calculations.
    const quiz = stripWrongArithmetic(toQuizData(aiResponse, { grade, subject, quizType }));
    if (quiz.questions.length === 0) return errorResponse('invalid_ai_output');

    console.log(
      `generate-quiz: ok in ${Date.now() - startedAt}ms, ${quiz.questions.length}/${questionCount} questions, mode=${aiResponse.lessonMode}`
    );
    return jsonResponse(200, { quiz, lessonMode: aiResponse.lessonMode });
  } catch (err) {
    if (err instanceof GenerationError) {
      console.error(`generate-quiz: failed (${err.code}) in ${Date.now() - startedAt}ms`);
      return errorResponse(err.code);
    }
    console.error('generate-quiz: unexpected error', err);
    return errorResponse('unknown_error');
  }
});
