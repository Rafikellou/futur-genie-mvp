// Stable application-level error codes for AI quiz generation. The Edge
// Function returns one of these codes (never a raw provider/HTTP error —
// CLAUDE.md §24), and the app maps each to French, jargon-free copy
// (CLAUDE.md §34) plus a recovery action. Centralized so backend and app
// never drift on the set of codes — see CLAUDE.md §46.
export type GenerationErrorCode =
  | 'unreadable_image'
  | 'insufficient_content'
  | 'model_timeout'
  | 'model_unavailable'
  | 'invalid_ai_output'
  | 'unauthorized'
  | 'invalid_request'
  | 'unknown_error';

export const GENERATION_ERROR_MESSAGES: Record<GenerationErrorCode, string> = {
  unreadable_image:
    "Nous n'arrivons pas à lire correctement cette photo. Reprenez-la avec un bon éclairage, sans reflet, en cadrant toute la leçon.",
  insufficient_content:
    "Cette photo ne contient pas assez d'éléments pour créer un devoir fiable. Essayez avec une leçon plus complète.",
  model_timeout: 'La création du devoir prend trop de temps. Réessayez dans un instant.',
  model_unavailable:
    'Le service de création est momentanément indisponible. Réessayez dans un instant.',
  invalid_ai_output:
    "Nous n'avons pas réussi à créer un devoir exploitable à partir de cette photo. Réessayez, ou choisissez une autre photo.",
  unauthorized: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  invalid_request: 'Il manque une information nécessaire. Revenez en arrière et réessayez.',
  unknown_error: 'Une erreur inattendue est survenue. Réessayez dans un instant.',
};

// Errors the teacher can plausibly resolve by retaking/reselecting the
// photo, vs. ones where "try again" (same photo) is the only lever. Used by
// the UI to decide which recovery action(s) to offer.
export const RETAKE_PHOTO_ERRORS: ReadonlySet<GenerationErrorCode> = new Set([
  'unreadable_image',
  'insufficient_content',
]);
