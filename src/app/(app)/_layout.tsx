import { Redirect, Stack, usePathname } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { isProfileComplete } from '@shared/domain/profile';

// The tab bar (Accueil / Mes devoirs / Suggestions / Profil) is the anchor of
// the authenticated area; the creation-flow screens are pushed on top of it.
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AppLayout() {
  const { profile } = useAuth();
  const pathname = usePathname();

  // Still fetching the profile row for a known session — render nothing rather
  // than briefly flashing the onboarding screen before we know its state.
  if (profile === undefined) {
    return null;
  }

  // The teacher must fill in their identity + school + class level once, right
  // after their first sign-in, before anything else in the app is reachable.
  const needsOnboarding = !isProfileComplete(profile);
  const onOnboarding = pathname === '/onboarding';

  if (needsOnboarding && !onOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  if (!needsOnboarding && onOnboarding) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
