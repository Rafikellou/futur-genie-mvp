// Edge Function: delete-account
//
// Lets a signed-in teacher permanently delete their own account, required by
// Apple App Review guideline 5.1.1(v) (any app offering account creation
// must also offer in-app account deletion). An Edge Function is required
// because deleting an auth.users row can only be done with the service-role
// key (never exposed to the client — CLAUDE.md §30), so this is the one
// piece of the deletion flow the client cannot do directly.
//
// Deleting the auth.users row cascades through `profiles` -> `quizzes` ->
// `submissions` (all declared `on delete cascade`), so a single admin call
// here removes every trace of the teacher's data. No separate cleanup
// queries are needed.
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: { code: 'invalid_request' } });
  }

  // Derive the caller's identity from their own session — a teacher can only
  // ever delete their own account, never one supplied via the request body
  // (CLAUDE.md §48).
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse(401, { error: { code: 'unauthorized' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('delete-account: Supabase env vars not configured');
    return jsonResponse(500, { error: { code: 'unknown_error' } });
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse(401, { error: { code: 'unauthorized' } });
  }

  // Service-role client, used only for this one admin call — never returned
  // to the client, never logged.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    console.error('delete-account: failed to delete user', deleteError.message);
    return jsonResponse(500, { error: { code: 'unknown_error' } });
  }

  console.log('delete-account: account deleted');
  return jsonResponse(200, { ok: true });
});
