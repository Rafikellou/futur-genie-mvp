// Edge Function: notify-feedback
//
// Called by a Supabase Database Webhook (configured in Studio, not in a
// migration — see supabase/README.md) on every INSERT into public.feedback,
// to email the product owner a real-time alert. Purely a convenience
// notification: the suggestion is already safely committed to the database
// by the time this runs, so a failure here (Resend down, bad address, etc.)
// never loses data and is never retried.
//
// Authentication: this function is invoked machine-to-machine by the
// database, not by a signed-in teacher, so it has no Supabase user JWT to
// check (verify_jwt = false, see supabase/config.toml). It authenticates the
// caller instead via a shared secret header the webhook is configured to
// send, checked against FEEDBACK_WEBHOOK_SECRET below.
import { createClient } from '@supabase/supabase-js';

type FeedbackRecord = {
  id: string;
  teacher_id: string;
  category: string;
  message: string;
  created_at: string;
};

type WebhookPayload = {
  type: string;
  table: string;
  record: FeedbackRecord;
};

const CATEGORY_LABELS: Record<string, string> = {
  feature: 'Idée de fonctionnalité',
  problem: 'Problème rencontré',
  other: 'Autre',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: { code: 'invalid_request' } });
  }

  const webhookSecret = Deno.env.get('FEEDBACK_WEBHOOK_SECRET');
  if (!webhookSecret || req.headers.get('x-webhook-secret') !== webhookSecret) {
    return jsonResponse(401, { error: { code: 'unauthorized' } });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const alertEmail = Deno.env.get('FEEDBACK_ALERT_EMAIL');
  const fromAddress = Deno.env.get('FEEDBACK_ALERT_FROM') ?? 'onboarding@resend.dev';
  if (!resendApiKey || !alertEmail) {
    console.error('notify-feedback: RESEND_API_KEY or FEEDBACK_ALERT_EMAIL not configured');
    return jsonResponse(500, { error: { code: 'unknown_error' } });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: { code: 'invalid_request' } });
  }

  const record = payload.record;
  if (!record?.message || !record.category) {
    return jsonResponse(400, { error: { code: 'invalid_request' } });
  }

  // Best-effort: the teacher's email is a "nice to have" for context, never
  // required for the alert to be useful or to be sent.
  let teacherEmail = 'adresse inconnue';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseUrl && serviceRoleKey && record.teacher_id) {
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data } = await adminClient.auth.admin.getUserById(record.teacher_id);
      if (data.user?.email) {
        teacherEmail = data.user.email;
      }
    } catch (err) {
      console.warn('notify-feedback: failed to look up teacher email', err);
    }
  }

  const categoryLabel = CATEGORY_LABELS[record.category] ?? record.category;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [alertEmail],
        subject: `Nouvelle suggestion Futur Génie : ${categoryLabel}`,
        text: `${record.message}\n\n— ${teacherEmail}`,
      }),
    });
    if (!response.ok) {
      console.error('notify-feedback: Resend returned an error', response.status);
    }
  } catch (err) {
    console.error('notify-feedback: failed to call Resend', err);
  }

  // Always 200: this is a fire-and-forget notification triggered after the
  // row is already committed, so there is nothing to roll back and nothing
  // gained by asking the webhook to retry.
  return jsonResponse(200, { ok: true });
});
