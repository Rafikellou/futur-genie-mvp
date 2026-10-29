-- RLS check for quiz deletion (« Premiers pas », docs/design/README.md §7.4).
--
-- Asserts that:
--   1. a teacher cannot delete another teacher's quiz;
--   2. an anonymous visitor cannot delete any quiz or submission;
--   3. a teacher can delete their own quiz, and its submissions go with it
--      (submissions.quiz_id ... on delete cascade).
--
-- Run it whole in the Supabase SQL editor (postgres role) or with psql against
-- a non-production database. Everything happens in one transaction that ends
-- with ROLLBACK, so no test data is left behind. Success returns one row
-- "delete_quiz_rls: all checks passed"; any failed check raises an exception.

begin;

-- Two throwaway teachers; handle_new_user() creates their profiles.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'rls-test-a@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'rls-test-b@example.invalid', 'authenticated', 'authenticated');

insert into public.quizzes (id, teacher_id, title, grade, subject, quiz_type, status, quiz_data) values
  ('00000000-0000-4000-8000-00000000aa01', '00000000-0000-4000-8000-0000000000a1', 'Quiz A', 'CE2', 'mathematiques', 'mixed', 'published', '{}'),
  ('00000000-0000-4000-8000-00000000bb01', '00000000-0000-4000-8000-0000000000b2', 'Quiz B', 'CE2', 'mathematiques', 'mixed', 'published', '{}');

insert into public.submissions (quiz_id, student_name, answers, correct_count, gradable_count) values
  ('00000000-0000-4000-8000-00000000aa01', 'Léa', '{}', 1, 2),
  ('00000000-0000-4000-8000-00000000aa01', 'Tom', '{}', 2, 2),
  ('00000000-0000-4000-8000-00000000bb01', 'Inès', '{}', 0, 2);

-- 1. Teacher A tries to delete teacher B's quiz and submission.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

delete from public.quizzes where id = '00000000-0000-4000-8000-00000000bb01';
delete from public.submissions where quiz_id = '00000000-0000-4000-8000-00000000bb01';

-- 2. An anonymous visitor tries to delete everything.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

delete from public.quizzes;
delete from public.submissions;

reset role;
do $$
begin
  if (select count(*) from public.quizzes where id in (
        '00000000-0000-4000-8000-00000000aa01', '00000000-0000-4000-8000-00000000bb01')) <> 2 then
    raise exception 'FAIL: a quiz was deleted by a non-owner or by anon';
  end if;
  if (select count(*) from public.submissions where quiz_id in (
        '00000000-0000-4000-8000-00000000aa01', '00000000-0000-4000-8000-00000000bb01')) <> 3 then
    raise exception 'FAIL: a submission was deleted by a non-owner or by anon';
  end if;
end $$;

-- 3. Teacher A deletes their own quiz.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

delete from public.quizzes where id = '00000000-0000-4000-8000-00000000aa01';

reset role;
do $$
begin
  if exists (select 1 from public.quizzes where id = '00000000-0000-4000-8000-00000000aa01') then
    raise exception 'FAIL: owner could not delete their own quiz';
  end if;
  if exists (select 1 from public.submissions where quiz_id = '00000000-0000-4000-8000-00000000aa01') then
    raise exception 'FAIL: submissions of the deleted quiz were not removed';
  end if;
  if (select count(*) from public.submissions where quiz_id = '00000000-0000-4000-8000-00000000bb01') <> 1 then
    raise exception 'FAIL: deleting quiz A touched quiz B''s submissions';
  end if;
end $$;

-- Only reached when every check above passed.
select 'delete_quiz_rls: all checks passed' as result;

rollback;
