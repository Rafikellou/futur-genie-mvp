-- Logs one row per lesson-photo sent to the multimodal LLM, so generate-quiz
-- can enforce a per-teacher daily quota before spending OpenAI tokens
-- (CLAUDE.md §55). Deliberately separate from `quizzes`: a draft is only
-- persisted at publish time (see create_quizzes.sql), but every generation
-- *attempt* costs tokens whether or not the teacher ever publishes — so the
-- quota must count attempts, not quizzes.

create table public.generation_attempts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Supports "count this teacher's attempts in the last 24h" efficiently.
create index generation_attempts_teacher_id_created_at_idx
  on public.generation_attempts (teacher_id, created_at);

alter table public.generation_attempts enable row level security;

-- generate-quiz calls the database as the teacher (their own JWT, not the
-- service role — see supabase/functions/generate-quiz/index.ts), so it needs
-- its own insert/select policies just like a normal teacher-owned table.
create policy "Teachers can log their own generation attempts"
  on public.generation_attempts for insert
  to authenticated
  with check (teacher_id = auth.uid());

create policy "Teachers can read their own generation attempts"
  on public.generation_attempts for select
  to authenticated
  using (teacher_id = auth.uid());

-- Deliberately no update/delete policy: a teacher must not be able to erase
-- their own attempt history to reset the quota. RLS default-denies both.
