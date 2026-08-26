-- Quiz drafts and published quizzes (Milestone 7).
-- A row is created by the teacher's client directly (no Edge Function needed
-- for this — no secret involved) once a draft is ready to publish; it starts
-- as 'draft' and the publish_quiz() RPC below flips it to 'published'.

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null,
  grade text not null,
  subject text not null,
  quiz_type text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  -- Full AI/teacher-edited quiz (shared/domain/quiz.ts `QuizData`, including
  -- `sourceEvidence`) — teacher-only, never read through the public view.
  quiz_data jsonb not null,
  -- `quiz_data` with `sourceEvidence` stripped from every question, computed
  -- by publish_quiz() at publish time (CLAUDE.md §23/§29). Null until published.
  public_quiz_data jsonb,
  -- Non-sequential public identifier (CLAUDE.md §29). Null until published.
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index quizzes_teacher_id_idx on public.quizzes (teacher_id);

alter table public.quizzes enable row level security;

-- A teacher may only see/change their own quizzes, draft or published. Public
-- reads never go through this table — see the public_quizzes view below.
create policy "Teachers can read their own quizzes"
  on public.quizzes for select
  to authenticated
  using (teacher_id = auth.uid());

create policy "Teachers can create their own quizzes"
  on public.quizzes for insert
  to authenticated
  with check (teacher_id = auth.uid());

create policy "Teachers can update their own quizzes"
  on public.quizzes for update
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Teachers can delete their own quizzes"
  on public.quizzes for delete
  to authenticated
  using (teacher_id = auth.uid());

-- Reuses the trigger function created for `profiles` (Milestone 2).
create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row
  execute function public.set_updated_at();

-- Random, non-guessable public slug. Excludes visually ambiguous characters
-- (0/O, 1/l/I) since a teacher may read or type it out for a student.
-- 10 characters over a 57-character alphabet is far beyond guessable.
create function public.generate_quiz_slug()
returns text
language sql
as $$
  select string_agg(
    substr(
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789',
      (random() * 57)::int + 1,
      1
    ),
    ''
  )
  from generate_series(1, 10);
$$;

-- Publishes a quiz the caller owns. Runs as the calling role (no `security
-- definer`) so ordinary RLS already protects the reads/updates below —
-- the explicit ownership check just turns a foreign quiz into a clean
-- `quiz_not_found` instead of a generic RLS no-op.
create function public.publish_quiz(p_quiz_id uuid)
returns public.quizzes
language plpgsql
as $$
declare
  v_quiz public.quizzes;
  v_slug text;
  v_attempts int := 0;
begin
  select * into v_quiz from public.quizzes where id = p_quiz_id;

  if not found then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;

  if v_quiz.teacher_id <> auth.uid() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  -- Keep the existing slug on a re-publish (e.g. after editing a published
  -- quiz) so a previously shared link never breaks.
  if v_quiz.public_slug is null then
    loop
      v_attempts := v_attempts + 1;
      if v_attempts > 10 then
        raise exception 'slug_generation_failed' using errcode = 'P0001';
      end if;

      v_slug := public.generate_quiz_slug();
      begin
        update public.quizzes set public_slug = v_slug where id = p_quiz_id;
        exit;
      exception when unique_violation then
        -- Collision on the unique constraint: try another slug.
      end;
    end loop;
  end if;

  update public.quizzes
  set
    status = 'published',
    published_at = coalesce(published_at, now()),
    public_quiz_data = jsonb_set(
      quiz_data,
      '{questions}',
      -- jsonb_agg() over zero rows returns NULL, not `[]` — coalesce keeps
      -- public_quiz_data.questions a valid (empty) array in that edge case.
      coalesce(
        (
          select jsonb_agg(question - 'sourceEvidence')
          from jsonb_array_elements(quiz_data -> 'questions') as question
        ),
        '[]'::jsonb
      )
    )
  where id = p_quiz_id
  returning * into v_quiz;

  return v_quiz;
end;
$$;

revoke all on function public.publish_quiz(uuid) from public;
grant execute on function public.publish_quiz(uuid) to authenticated;

-- Public read surface: only published quizzes, only the fields a student
-- needs. Created with the default view behavior (security_invoker = false,
-- i.e. runs as the view's owner) so it can read across every teacher's rows
-- despite the table's owner-only RLS above — access control for anonymous
-- readers is entirely the `where status = 'published'` clause plus the
-- explicit column list (never teacher_id, never quiz_data with sourceEvidence).
create view public.public_quizzes
with (security_invoker = false)
as
select
  id,
  title,
  grade,
  subject,
  quiz_type,
  public_slug,
  public_quiz_data,
  published_at
from public.quizzes
where status = 'published';

grant select on public.public_quizzes to anon, authenticated;
