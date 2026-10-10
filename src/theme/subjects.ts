import type { Subject } from '@shared/domain/subject';

import { colors } from './colors';

// Visual identity of each subject in quiz lists: a short tag and a tint.
// Only 4 tints exist for 7 subjects, so some share a color — the tag keeps
// them distinct (color is never the only signal, CLAUDE.md §37).
export const subjectStyles: Record<Subject, { tag: string; tint: { background: string; text: string } }> = {
  francais: { tag: 'FRA', tint: colors.tint.violet },
  mathematiques: { tag: 'MAT', tint: colors.tint.orange },
  histoire: { tag: 'HIS', tint: colors.tint.orange },
  geographie: { tag: 'GÉO', tint: colors.tint.blue },
  sciences: { tag: 'SCI', tint: colors.tint.pink },
  anglais: { tag: 'ANG', tint: colors.tint.blue },
  autre: { tag: '•••', tint: colors.tint.violet },
};
