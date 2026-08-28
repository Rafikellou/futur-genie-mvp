import { Session } from '@supabase/supabase-js';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  composeDisplayName,
  mapProfileRow,
  Profile,
  TeacherDetails,
} from '@shared/domain/profile';
import { supabase } from '@shared/supabase/client';

import { getAuthErrorMessage } from './authErrors';

type AuthContextValue = {
  // `undefined` while the initial session is still being restored from
  // storage; `null` once we know for certain there is no signed-in teacher.
  session: Session | null | undefined;
  // `undefined` while the profile row is still being fetched for a known
  // session; `null` once fetched and found missing (or no session).
  profile: Profile | null | undefined;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateTeacherDetails: (details: TeacherDetails) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, display_name, title, first_name, last_name, school_name, school_postal_code, class_grade, created_at, updated_at',
    )
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
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

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
    if (session === undefined) return;
    if (!session) {
      setProfile(null);
      return;
    }
    setProfile(undefined);
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

  const updateTeacherDetails = useCallback(
    async (details: TeacherDetails) => {
      if (!session) return;
      // The student-facing display name is derived here, never typed by the
      // teacher — keeps the public quiz greeting and Home greeting in sync
      // with the structured fields.
      const displayName = composeDisplayName(details.title, details.lastName);
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          title: details.title,
          first_name: details.firstName.trim(),
          last_name: details.lastName.trim(),
          school_name: details.schoolName.trim(),
          school_postal_code: details.schoolPostalCode.trim(),
          class_grade: details.classGrade,
        })
        .eq('id', session.user.id);
      if (error) throw new Error(getAuthErrorMessage(error));
      // Re-read the row rather than patching local state: the (app) layout's
      // onboarding gate keys off this value, so it must reflect exactly what
      // the database now holds.
      setProfile(await fetchProfile(session.user.id));
    },
    [session],
  );

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) throw new Error('Une erreur est survenue. Réessayez dans un instant.');
    // The server-side deletion already invalidated the session; clear it
    // locally too so the app switches to the signed-out state immediately
    // instead of waiting for the next failed request.
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading: session === undefined,
        signIn,
        signUp,
        signOut,
        updateTeacherDetails,
        deleteAccount,
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
