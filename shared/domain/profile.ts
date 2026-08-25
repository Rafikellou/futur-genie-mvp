// Teacher profile, mirroring the `public.profiles` table.
// Row creation is handled entirely by a database trigger (see
// supabase/migrations) — the app only ever reads and updates this row.
export type Profile = {
  id: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

// Row shape as returned by Supabase (snake_case columns).
type ProfileRow = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
