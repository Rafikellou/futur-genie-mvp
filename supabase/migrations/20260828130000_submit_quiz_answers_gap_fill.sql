-- Teach the server-side grader about the new "gap_fill" (texte à trous)
-- question type. Mechanically it grades exactly like multiple_choice: the
-- student's answer value is a string that must equal the question's
-- `correctAnswer` string. "short_answer" is gone (never auto-graded); every
-- remaining type is now auto-graded, so gradable_count always equals the
-- number of questions.
--
-- Body is otherwise identical to 20260826090000_create_submissions.sql.

create or replace function public.submit_quiz_answers(
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

  select id, public_quiz_data into v_quiz_id, v_quiz_data
  from public.quizzes
  where public_slug = p_slug and status = 'published';

  if not found then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;

  for v_question in select * from jsonb_array_elements(v_quiz_data -> 'questions')
  loop
    if v_question ->> 'type' in ('multiple_choice', 'true_false', 'gap_fill') then
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
