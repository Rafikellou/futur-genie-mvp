import { Stack } from 'expo-router';

// The tab bar (Accueil / Mes devoirs / Suggestions / Profil) is the anchor of
// the authenticated area; the creation-flow screens are pushed on top of it.
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
