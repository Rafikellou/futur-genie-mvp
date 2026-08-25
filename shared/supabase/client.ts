import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails fast and loudly during development instead of the app silently
  // making requests to `undefined`. See .env.example for the required keys.
  throw new Error(
    'Missing Supabase configuration. Copy .env.example to .env and fill in ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

// The anon key is safe to embed in the client bundle by design (Supabase's
// public client key). Privileged keys (service role, LLM provider) must
// never live here — see supabase/functions for server-side secrets.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage's web implementation touches `window` directly, which
    // breaks Expo Router's static SSR export (no `window` on the server).
    // On web, leave `storage` unset so supabase-js falls back to its own
    // browser-safe default (localStorage in the browser, in-memory during
    // SSR); native platforms keep AsyncStorage for persistence.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
