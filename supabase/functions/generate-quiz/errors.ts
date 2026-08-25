// Wraps a stable GenerationErrorCode so it can be thrown/caught through the
// generation pipeline without ever leaking a raw provider error or stack
// trace to the client (CLAUDE.md §24).
import type { GenerationErrorCode } from '../../../shared/domain/generationErrors.ts';

export class GenerationError extends Error {
  readonly code: GenerationErrorCode;

  constructor(code: GenerationErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

// Content/quality issues are 422 (well-formed request the pipeline still
// can't satisfy); auth is 401; a malformed request is 400; upstream
// failures are 502/504; anything else is 500.
export function statusForErrorCode(code: GenerationErrorCode): number {
  switch (code) {
    case 'unauthorized':
      return 401;
    case 'invalid_request':
      return 400;
    case 'unreadable_image':
    case 'insufficient_content':
    case 'invalid_ai_output':
      return 422;
    case 'model_timeout':
      return 504;
    case 'model_unavailable':
      return 502;
    case 'unknown_error':
    default:
      return 500;
  }
}
