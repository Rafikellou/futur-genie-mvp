import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

// Bottom tab bar for the four "home base" areas of the app. The creation flow
// (create → create-photo → quiz-draft → quiz-published) deliberately lives in
// the parent Stack, above these tabs, so the menu disappears while a teacher
// is building a devoir and reappears once it's published — keeping the
// 60-second flow focused (CLAUDE.md §4, §35).
//
// The bar itself is the custom floating capsule in src/components/TabBar.tsx
// (icons, active pill). It floats over the content, so each tab screen pads
// its scrollable content with `useTabBarSpace()`.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="my-quizzes" options={{ title: 'Mes devoirs' }} />
      <Tabs.Screen name="suggestions" options={{ title: 'Suggestions' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
