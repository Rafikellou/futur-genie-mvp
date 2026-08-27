import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { COLORS } from '@/theme/colors';

// Bottom tab bar for the four "home base" areas of the app. The creation flow
// (create → create-photo → quiz-draft → quiz-published) deliberately lives in
// the parent Stack, above these tabs, so the menu disappears while a teacher
// is building a devoir and reappears once it's published — keeping the
// 60-second flow focused (CLAUDE.md §4, §35).
//
// Icons are plain emoji on purpose: no extra dependency, and they render
// identically on iOS, Android and web (CLAUDE.md §41).
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#8A8A8E',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-quizzes"
        options={{
          title: 'Mes devoirs',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📄" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="suggestions"
        options={{
          title: 'Suggestions',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
