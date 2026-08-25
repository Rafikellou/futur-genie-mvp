-- Teacher profile: one row per Supabase Auth user.
-- Created automatically by a trigger on auth.users so the app never has to
-- orchestrate a separate "create profile" step after sign-up.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Teachers may only read and update their own profile. There is no insert
-- or delete policy: rows are created by the trigger below (which runs with
-- elevated privileges) and removed automatically via the auth.users cascade.
create policy "Teachers can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Teachers can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Auto-create a profile row whenever a new teacher signs up. `security
-- definer` is required because the inserting role (the Auth service) has no
-- direct insert grant on public.profiles; `search_path` is pinned to guard
-- against search-path hijacking in a security-definer function.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
