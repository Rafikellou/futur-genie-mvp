// Teacher civility. Centralized like grades/subjects so no screen or schema
// duplicates the list (CLAUDE.md §46). Kept to the two forms in current
// official French usage.
export type TeacherTitle = 'Mme' | 'M.';

export const TEACHER_TITLES: { value: TeacherTitle; label: string }[] = [
  { value: 'Mme', label: 'Mme' },
  { value: 'M.', label: 'M.' },
];
