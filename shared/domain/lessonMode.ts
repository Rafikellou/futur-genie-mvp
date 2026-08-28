// How the AI decided to treat the photographed lesson, reported alongside a
// generated draft (never persisted, never published — it is a review aid,
// see CLAUDE.md §23). Centralized so the Edge Function and the app agree on
// the set of values and their French labels (CLAUDE.md §46).
//
//  - generative: the lesson teaches a rule or method (a conjugation pattern,
//    an addition procedure). The quiz should make the student *apply* it to
//    fresh cases, not recite the worked examples.
//  - factual:    the lesson is a finite body of facts (a date, a scientific
//    fact, a definition). The quiz should test recall of what it states.
//  - mixed:      both at once (a science lesson with vocabulary to memorize
//    and a phenomenon to understand).
export type LessonMode = 'generative' | 'factual' | 'mixed';

export const LESSON_MODES: LessonMode[] = ['generative', 'factual', 'mixed'];

// Teacher-facing, French, jargon-free (CLAUDE.md §34) — shown on the review
// screen so the teacher can tell at a glance how the quiz was built and
// double-check it if the AI guessed wrong.
export const LESSON_MODE_LABELS: Record<LessonMode, string> = {
  generative: "Ce devoir entraîne l'élève à appliquer une règle vue en leçon.",
  factual: "Ce devoir vérifie ce que l'élève a retenu de la leçon.",
  mixed: "Ce devoir mêle application d'une règle et mémorisation de la leçon.",
};
