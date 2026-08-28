// Exercise (quiz) configuration options. Centralized so the create-exercise
// form and the future AI generation schema share one definition — see
// CLAUDE.md §19 and §46.
export type QuizType = 'multiple_choice' | 'true_false' | 'gap_fill' | 'matching' | 'mixed';

export const EXERCISE_TYPES: { value: QuizType; label: string }[] = [
  { value: 'multiple_choice', label: 'QCM' },
  { value: 'true_false', label: 'Vrai / Faux' },
  { value: 'gap_fill', label: 'Texte à trous' },
  { value: 'matching', label: 'Reliez les paires' },
  { value: 'mixed', label: 'Mixte' },
];

// Presented as presets rather than free typing, matching the teacher UX
// principle of minimal typing (CLAUDE.md §35).
export const QUESTION_COUNT_OPTIONS: number[] = [5, 10, 15];

export const DEFAULT_QUESTION_COUNT = 10;
