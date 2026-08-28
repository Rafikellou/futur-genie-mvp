-- Structured teacher identity, collected through a mandatory in-app
-- onboarding screen shown after the first sign-in — NOT through Supabase Auth
-- sign-up, which stays a plain email + password step (product decision:
-- the account-creation flow is not touched).
--
-- Every column is nullable so handle_new_user() keeps inserting a bare row
-- unchanged. The app treats a profile with any of these fields empty as
-- "onboarding not done" and forces the form before the tabs are reachable.
--
-- title / first_name / last_name identify the teacher.
-- school_name + school_postal_code situate their school — new identifiable
--   data about the teacher (not students); flagged for privacy review and
--   described in the in-app privacy policy (CLAUDE.md §33).
-- class_grade is their everyday class level, pre-filled into the
--   create-exercise form (still editable there).
--
-- RLS is unchanged: the existing "Teachers can update their own profile"
-- policy already covers writing these columns.

alter table public.profiles
  add column title text
    check (title in ('M.', 'Mme')),
  add column first_name text
    check (char_length(btrim(first_name)) between 1 and 50),
  add column last_name text
    check (char_length(btrim(last_name)) between 1 and 50),
  add column school_name text
    check (char_length(btrim(school_name)) between 1 and 120),
  add column school_postal_code text
    check (school_postal_code ~ '^[0-9]{5}$'),
  add column class_grade text
    check (class_grade in ('CP', 'CE1', 'CE2', 'CM1', 'CM2'));
