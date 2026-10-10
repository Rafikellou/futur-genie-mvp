-- Emails the product owner when a teacher submits feedback (Suggestions
-- screen), by calling the notify-feedback Edge Function directly via pg_net
-- from a trigger — rather than through the Supabase Studio "Database
-- Webhooks" UI feature, which turned out to be unavailable on this project
-- (`ERROR: 3F000: schema "supabase_functions" does not exist` — a
-- platform-side provisioning gap, not something a migration can fix). This
-- keeps the whole pipeline reproducible through `supabase db push` instead
-- of a manual, unscriptable dashboard step.
--
-- The shared secret used to authenticate this call to the Edge Function
-- (matching FEEDBACK_WEBHOOK_SECRET, set via `supabase secrets set` — see
-- supabase/README.md) is deliberately NOT hardcoded here: it is read from
-- Supabase Vault, where the project owner stores it once, out of band, via
-- the SQL editor — never committed to Git (CLAUDE.md §30). Vault (not a
-- plain `alter database ... set`) because Supabase's hosted platform
-- rejects instance-level custom parameters (`permission denied to set
-- parameter`) — Vault is its supported mechanism for a secret a function
-- needs to read:
--
--   select vault.create_secret('<value>', 'feedback_webhook_secret');
--
-- security definer: the inserting role (authenticated, via the app) has no
-- direct grant on net.http_post or vault.decrypted_secrets — the function
-- owner's privileges are used instead, same pattern as
-- handle_new_user()/submit_quiz_answers().
create function public.notify_feedback_inserted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'feedback_webhook_secret';

  perform net.http_post(
    url := 'https://otrtxtkghhnxmmfqgvdr.functions.supabase.co/notify-feedback',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'feedback',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

create trigger feedback_notify_after_insert
  after insert on public.feedback
  for each row
  execute function public.notify_feedback_inserted();
