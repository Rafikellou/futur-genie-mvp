-- Student submissions to a published quiz (Milestone 9). A student never
-- authenticates: a submission is identified only by a freely-typed first
-- name, scoped to one quiz, and never linked across quizzes into a student
-- profile (CLAUDE.md §16/§32).

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  student_name text not null check (char_length(btrim(student_name)) between 1 and 50),
  -- Shape: shared/domain (AnswerMap, moved there from
  -- src/features/quiz-taking/grading.ts in this same milestone).
  answers jsonb not null,
  correct_count int not null,
  gradable_count int not null,
  created_at timestamptz not null default now()
);

create index submissions_quiz_id_idx on public.submissions (quiz_id);

alter table public.submissions enable row level security;

-- A teacher may only read/delete submissions to quizzes they own. No policy
-- reads through teacher_id directly (submissions has none) — ownership is
-- checked via the parent quizzes row instead.
create policy "Teachers can read submissions to their own quizzes"
  on public.submissions for select
  to authenticated
  using (exists (
    select 1 from public.quizzes q
    where q.id = submissions.quiz_id and q.teacher_id = auth.uid()
  ));

create policy "Teachers can delete submissions to their own quizzes"
  on public.submissions for delete
  to authenticated
  using (exists (
    select 1 from public.quizzes q
    where q.id = submissions.quiz_id and q.teacher_id = auth.uid()
  ));

-- Deliberately no INSERT/UPDATE policy: the only way to write a row is
-- through submit_quiz_answers() below (security definer). Opening an INSERT
-- policy to `anon` would let anyone post an arbitrary score directly via the
-- REST API, bypassing server-side grading entirely (CLAUDE.md §48).

-- Records one student's submission to a published quiz, recomputing the
-- score server-side from the quiz's own public_quiz_data — the only source
-- of truth for a correct answer. Never trusts a score from the client.
create function public.submit_quiz_answers(
  p_slug text,
  p_student_name text,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quiz_id uuid;
  v_quiz_data jsonb;
  v_name text := btrim(p_student_name);
  v_correct int := 0;
  v_gradable int := 0;
  v_question jsonb;
begin
  if char_length(v_name) = 0 or char_length(v_name) > 50 then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;

  -- Looked up by public_slug + status = 'published' only: a draft can never
  -- receive a submission, and a raw quiz_id can never be guessed/used to
  -- target a specific row from outside.
  select id, public_quiz_data into v_quiz_id, v_quiz_data
  from public.quizzes
  where public_slug = p_slug and status = 'published';

  if not found then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;

  for v_question in select * from jsonb_array_elements(v_quiz_data -> 'questions')
  loop
    if v_question ->> 'type' in ('multiple_choice', 'true_false') then
      v_gradable := v_gradable + 1;
      if (p_answers -> (v_question ->> 'id') -> 'value') = (v_question -> 'correctAnswer')
      then
        v_correct := v_correct + 1;
      end if;
    end if;
  end loop;

  insert into public.submissions (quiz_id, student_name, answers, correct_count, gradable_count)
  values (v_quiz_id, v_name, p_answers, v_correct, v_gradable);
end;
$$;

revoke all on function public.submit_quiz_answers(text, text, jsonb) from public;
grant execute on function public.submit_quiz_answers(text, text, jsonb) to anon, authenticated;
