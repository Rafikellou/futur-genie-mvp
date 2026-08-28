// Client side of AI quiz generation (Milestone 5): reads the compressed
// lesson photo as base64, calls the `generate-quiz` Edge Function, and
// normalizes every outcome into a typed result. Callers never need to catch
// an exception — network failures, non-2xx responses and a malformed
// response all resolve to a `GenerationErrorCode` (CLAUDE.md §24/§39).
import * as FileSystem from 'expo-file-system/legacy';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@shared/supabase/client';
import { QuizDataSchema, type QuizData } from '@shared/domain/quiz';
import { LESSON_MODES, type LessonMode } from '@shared/domain/lessonMode';
import type { GenerationErrorCode } from '@shared/domain/generationErrors';
import type { Grade } from '@shared/domain/grade';
import type { Subject } from '@shared/domain/subject';
import type { QuizType } from '@shared/domain/exercise';

import type { LessonImage } from './lessonImage';

export type GenerateQuizParams = {
  photo: LessonImage;
  grade: Grade;
  subject: Subject;
  quizType: QuizType;
  questionCount: number;
  teacherInstruction?: string;
};

export type GenerateQuizResult =
  | { ok: true; quiz: QuizData; lessonMode?: LessonMode }
  | { ok: false; code: GenerationErrorCode };

function readLessonMode(value: unknown): LessonMode | undefined {
  return (LESSON_MODES as string[]).includes(value as string)
    ? (value as LessonMode)
    : undefined;
}

export async function generateQuizFromLesson(
  params: GenerateQuizParams
): Promise<GenerateQuizResult> {
  try {
    // The photo is compressed to JPEG on-device (Milestone 4) and never
    // written anywhere else — read here just long enough to send it.
    const image = await FileSystem.readAsStringAsync(params.photo.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        image,
        mimeType: 'image/jpeg',
        grade: params.grade,
        subject: params.subject,
        quizType: params.quizType,
        questionCount: params.questionCount,
        teacherInstruction: params.teacherInstruction,
      },
    });

    if (error) {
      return { ok: false, code: await resolveErrorCode(error) };
    }

    // Re-validated on the client even though the Edge Function already
    // validates its own output — defends against a stale app talking to a
    // future backend shape, not against a malicious backend.
    const payload = data as { quiz?: unknown; lessonMode?: unknown } | null;
    const parsed = QuizDataSchema.safeParse(payload?.quiz);
    if (!parsed.success) {
      return { ok: false, code: 'invalid_ai_output' };
    }
    return { ok: true, quiz: parsed.data, lessonMode: readLessonMode(payload?.lessonMode) };
  } catch {
    // Covers file-read failures and anything else unexpected — the teacher
    // only needs a stable error code, not the underlying cause.
    return { ok: false, code: 'unknown_error' };
  }
}

async function resolveErrorCode(error: unknown): Promise<GenerationErrorCode> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      const code = body?.error?.code;
      if (typeof code === 'string') {
        return code as GenerationErrorCode;
      }
    } catch {
      // Response wasn't the JSON shape we expect — fall through below.
    }
  }
  // Network failure (FunctionsFetchError) or relay failure
  // (FunctionsRelayError): neither carries one of our error codes.
  return 'unknown_error';
}
