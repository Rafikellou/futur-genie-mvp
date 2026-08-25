// Supported subjects. Centralized so adding one later does not require
// touching every screen — see CLAUDE.md §18.
export type Subject =
  | 'francais'
  | 'mathematiques'
  | 'histoire'
  | 'geographie'
  | 'sciences'
  | 'anglais'
  | 'autre';

export const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'francais', label: 'Français' },
  { value: 'mathematiques', label: 'Mathématiques' },
  { value: 'histoire', label: 'Histoire' },
  { value: 'geographie', label: 'Géographie' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'anglais', label: 'Anglais' },
  { value: 'autre', label: 'Autre' },
];
