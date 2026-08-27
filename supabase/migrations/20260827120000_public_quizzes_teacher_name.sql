-- Expose the teacher's chosen display name on the public quiz surface so the
-- student screen can greet them by name ("Ton enseignant·e {nom} te propose
-- ce quiz…"). This is the teacher-picked display name only (e.g. "Mme
-- Dupont") — never the email or any other profile field (CLAUDE.md §29). The
-- teacher already shares this quiz link with their own students, so the name
-- attached to it is intentional, not a leak.
--
-- LEFT JOIN so a published quiz never disappears from the public view if its
-- profile row is somehow missing; teacher_name is then null and the student
-- screen falls back to a generic greeting.

create or replace view public.public_quizzes
with (security_invoker = false)
as
select
  q.id,
  q.title,
  q.grade,
  q.subject,
  q.quiz_type,
  q.public_slug,
  q.public_quiz_data,
  q.published_at,
  p.display_name as teacher_name
from public.quizzes q
left join public.profiles p on p.id = q.teacher_id
where q.status = 'published';

grant select on public.public_quizzes to anon, authenticated;
