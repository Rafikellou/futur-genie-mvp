-- Teacher-submitted suggestions from the in-app "Suggestions" screen
-- (src/app/(app)/(tabs)/suggestions.tsx). Fire-and-forget by design
-- (CLAUDE.md §6): no inbox, no replies, no status tracking in the app — the
-- teacher who wrote it can't read it back through the app either. Only the
-- product owner reads rows, via the Supabase dashboard/SQL editor.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('feature', 'problem', 'other')),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Teachers may only submit feedback, never read it back (or read anyone
-- else's) through the app — this is a one-way channel to the product owner,
-- not an in-app inbox. No select/update/delete policy is intentional.
create policy "Teachers can submit feedback"
  on public.feedback for insert
  to authenticated
  with check (teacher_id = auth.uid());
