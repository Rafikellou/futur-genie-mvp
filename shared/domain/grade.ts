// Supported elementary-school grades. Centralized so no screen or schema
// duplicates this list — see CLAUDE.md §17.
export type Grade = 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2';

export const GRADES: { value: Grade; label: string }[] = [
  { value: 'CP', label: 'CP' },
  { value: 'CE1', label: 'CE1' },
  { value: 'CE2', label: 'CE2' },
  { value: 'CM1', label: 'CM1' },
  { value: 'CM2', label: 'CM2' },
];
