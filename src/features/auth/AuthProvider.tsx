import { Session } from '@supabase/supabase-js';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { mapProfileRow, Profile } from '@shared/domain/profile';
import { supabase } from '@shared/supabase/client';

import { getAuthErrorMessage } from './authErrors';

type AuthContextValue = {
  // `undefined` while the initial session is still being restored from
  // storage; `null` once we know for certain there is no signed-in teacher.
  session: Session | null | undefined;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    // A missing profile is unexpected (the DB trigger should always create
    // one on sign-up) but must not crash the app — fall back to no profile
    // rather than surfacing a technical error on the home screen.
    return null;
  }

  return mapProfileRow(data);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    fetchProfile(session.user.id).then(setProfile);
  }, [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(getAuthErrorMessage(error));
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new Error(getAuthErrorMessage(error));
    // If email confirmation is required, Supabase returns a user but no
    // session yet — the teacher stays on the sign-in flow until confirmed.
    return { requiresEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(getAuthErrorMessage(error));
  }, []);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!session) return;
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', session.user.id);
      if (error) throw new Error(getAuthErrorMessage(error));
      setProfile((current) => (current ? { ...current, displayName } : current));
    },
    [session],
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading: session === undefined,
        signIn,
        signUp,
        signOut,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
