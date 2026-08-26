-- Milestone 11 hardening: the "Teachers can update their own quizzes" RLS
-- policy (see 20260825212040_create_quizzes.sql) is row-level only — it
-- cannot restrict which *columns* a direct client UPDATE may touch. That
-- let an authenticated teacher bypass publish_quiz() entirely via a plain
-- REST PATCH on their own row: setting a hand-picked (guessable)
-- public_slug, or flipping status to 'published' with a public_quiz_data
-- that still contains sourceEvidence. Impact was self-scoped (never a
-- cross-teacher leak — RLS still limited it to the caller's own row), but
-- it broke the non-guessable-slug and sourceEvidence-stripping guarantees
-- documented in CLAUDE.md §23/§29 for that teacher's own published quiz.
--
-- This trigger blocks any direct change to the four columns publish_quiz()
-- owns (status, public_slug, public_quiz_data, published_at) unless a
-- transaction-local flag is set — which only publish_quiz() itself sets,
-- right before it writes those columns. The app has never updated these
-- columns any other way, so this changes no existing behavior.
create function public.guard_quiz_publish_columns()
returns trigger
language plpgsql
as $$
begin
  if (
    new.status is distinct from old.status
    or new.public_slug is distinct from old.public_slug
    or new.public_quiz_data is distinct from old.public_quiz_data
    or new.published_at is distinct from old.published_at
  )
  and coalesce(current_setting('app.allow_publish_columns', true), 'off') <> 'on'
  then
    raise exception 'status/public_slug/public_quiz_data/published_at can only be changed by publish_quiz()'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger quizzes_guard_publish_columns
  before update on public.quizzes
  for each row
  execute function public.guard_quiz_publish_columns();

-- Replace publish_quiz() to set the guard flag (transaction-local — resets
-- automatically, no cleanup needed) before each of its writes to the
-- protected columns. Everything else about the function is unchanged from
-- 20260825212040_create_quizzes.sql.
create or replace function public.publish_quiz(p_quiz_id uuid)
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

  perform set_config('app.allow_publish_columns', 'on', true);

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
