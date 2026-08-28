// Calls the multimodal LLM and returns its validated structured output.
// This is the concrete implementation behind the conceptual
// `generateQuizFromLesson()` interface (CLAUDE.md §7) — a plain function,
// not a provider abstraction layer, since only one provider exists today.
import type { Grade } from '../../../shared/domain/grade.ts';
import type { Subject } from '../../../shared/domain/subject.ts';
import type { QuizType } from '../../../shared/domain/exercise.ts';

import { GenerationError } from './errors.ts';
import { SYSTEM_PROMPT, buildTaskPrompt } from './prompt.ts';
import { AiQuizResponseSchema, type AiQuizResponse } from './aiResponse.ts';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
// gpt-4o-mini was too weak for grade-level calibration and pedagogical
// nuance (see PROGRESS.md, Milestone 6 — a real CE2 lesson kept producing
// CP/CE1 questions). gpt-5.6-luna is the current cost-optimized multimodal
// reasoning model ($0.20/$1.20 per 1M tokens, 1M-token context, native
// image + structured-output support): still a reasoning model, so it can
// follow the multi-step instructions in prompt.ts (classify the lesson,
// then apply the rule to fresh cases, calibrate to the page). Starting
// here on purpose — if real CE2 lessons still come out too easy, move up
// to gpt-5.6-terra (same API shape, just change this string). gpt-4.1 is
// the fallback — previous-generation, non-reasoning, but a known-good
// multimodal model on this same endpoint, so it is the safe landing spot
// if the primary is unavailable (e.g. the account has no GPT-5 access) or
// returns something unparseable.
const PRIMARY_MODEL = 'gpt-5.6-luna';
const FALLBACK_MODEL = 'gpt-4.1';

// GPT-5 models are reasoning models; "low" keeps latency inside
// REQUEST_TIMEOUT_MS for a single-image request while still giving the
// model enough room to follow the classification/calibration steps. Older
// models (gpt-4.1/gpt-4o) reject this parameter, so it is only sent for
// gpt-5*.
function reasoningEffortFor(model: string): 'low' | undefined {
  return model.startsWith('gpt-5') ? 'low' : undefined;
}
// Generous enough for a vision request; leaves margin under the platform's
// function execution limit so a slow model call surfaces as our own
// model_timeout rather than an opaque platform-level failure.
const REQUEST_TIMEOUT_MS = 45_000;

// Mirrors WireQuestionSchema in aiResponse.ts — keep both in sync.
const RESPONSE_JSON_SCHEMA = {
  name: 'quiz_from_lesson',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      readable: { type: 'boolean' },
      sufficientContent: { type: 'boolean' },
      lessonMode: { type: 'string', enum: ['generative', 'factual', 'mixed'] },
      title: { type: 'string' },
      instructions: { type: 'string' },
      warnings: { type: 'array', items: { type: 'string' } },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
              enum: ['multiple_choice', 'true_false', 'gap_fill', 'matching'],
            },
            question: { type: 'string' },
            explanation: { type: 'string' },
            sourceEvidence: { type: 'string' },
            choices: { type: ['array', 'null'], items: { type: 'string' } },
            correctAnswer: { type: 'string' },
            // matching only; null otherwise.
            pairs: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                additionalProperties: false,
                properties: { left: { type: 'string' }, right: { type: 'string' } },
                required: ['left', 'right'],
              },
            },
          },
          required: [
            'type',
            'question',
            'explanation',
            'sourceEvidence',
            'choices',
            'correctAnswer',
            'pairs',
          ],
        },
      },
    },
    required: [
      'readable',
      'sufficientContent',
      'lessonMode',
      'title',
      'instructions',
      'warnings',
      'questions',
    ],
  },
};

export type GenerateParams = {
  imageBase64: string;
  mimeType: string;
  grade: Grade;
  subject: Subject;
  quizType: QuizType;
  questionCount: number;
  teacherInstruction?: string;
};

async function callModel(model: string, params: GenerateParams, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const reasoningEffort = reasoningEffortFor(model);

  let response: Response;
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: buildTaskPrompt(params) },
              {
                type: 'image_url',
                image_url: { url: `data:${params.mimeType};base64,${params.imageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: 'json_schema', json_schema: RESPONSE_JSON_SCHEMA },
        ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new GenerationError('model_timeout');
    }
    throw new GenerationError('model_unavailable', String(err));
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Never forward the provider's raw status/body to the client
    // (CLAUDE.md §24) — log just enough to diagnose (CLAUDE.md §49).
    console.error(`generate-quiz: OpenAI responded ${response.status} for model ${model}`);
    throw new GenerationError('model_unavailable');
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new GenerationError('invalid_ai_output', 'missing message content');
  }
  return content;
}

function parseAiResponse(content: string): AiQuizResponse {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new GenerationError('invalid_ai_output', 'response was not valid JSON');
  }

  const result = AiQuizResponseSchema.safeParse(json);
  if (!result.success) {
    throw new GenerationError('invalid_ai_output', result.error.message);
  }
  return result.data;
}

// One retry on the fallback model if the primary model's output doesn't
// parse/validate, or if the primary model itself is unavailable (e.g. the
// account cannot reach that model id). Not a general retry-on-any-error
// loop (CLAUDE.md §55: retries are a real cost) — a timeout still fails
// straight through, since retrying a slow call would blow the request
// budget.
const FALLBACK_TRIGGER_CODES = new Set(['invalid_ai_output', 'model_unavailable']);

export async function generateQuizFromLesson(
  params: GenerateParams,
  apiKey: string
): Promise<AiQuizResponse> {
  try {
    const content = await callModel(PRIMARY_MODEL, params, apiKey);
    return parseAiResponse(content);
  } catch (err) {
    if (err instanceof GenerationError && FALLBACK_TRIGGER_CODES.has(err.code)) {
      const content = await callModel(FALLBACK_MODEL, params, apiKey);
      return parseAiResponse(content);
    }
    throw err;
  }
}
