-- Teach the server-side grader about the "matching" (reliez les paires)
-- question type. Scored all-or-nothing: the question counts correct only if
-- the student matched every pair to its right-hand value, so it contributes
-- exactly one point like every other type. The student's answer for a
-- matching question is { "value": { "<pairIndex>": "<chosen right label>" } }.
--
-- multiple_choice / true_false / gap_fill grading is unchanged from
-- 20260828130000_submit_quiz_answers_gap_fill.sql.

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
  v_type text;
  v_qid text;
  v_pair_count int;
  v_idx int;
  v_pair_ok boolean;
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
    v_type := v_question ->> 'type';
    v_qid := v_question ->> 'id';

    if v_type in ('multiple_choice', 'true_false', 'gap_fill') then
      v_gradable := v_gradable + 1;
      if (p_answers -> v_qid -> 'value') = (v_question -> 'correctAnswer') then
        v_correct := v_correct + 1;
      end if;

    elsif v_type = 'matching' then
      v_gradable := v_gradable + 1;
      v_pair_count := coalesce(jsonb_array_length(v_question -> 'pairs'), 0);
      v_pair_ok := v_pair_count > 0;
      for v_idx in 0 .. v_pair_count - 1 loop
        if (p_answers -> v_qid -> 'value' ->> v_idx::text)
           is distinct from (v_question -> 'pairs' -> v_idx ->> 'right')
        then
          v_pair_ok := false;
        end if;
      end loop;
      if v_pair_ok then
        v_correct := v_correct + 1;
      end if;
    end if;
  end loop;

  insert into public.submissions (quiz_id, student_name, answers, correct_count, gradable_count)
  values (v_quiz_id, v_name, p_answers, v_correct, v_gradable);
end;
$$;
