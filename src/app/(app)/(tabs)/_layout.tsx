import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { COLORS } from '@/theme/colors';

// Bottom tab bar for the four "home base" areas of the app. The creation flow
// (create → create-photo → quiz-draft → quiz-published) deliberately lives in
// the parent Stack, above these tabs, so the menu disappears while a teacher
// is building a devoir and reappears once it's published — keeping the
// 60-second flow focused (CLAUDE.md §4, §35).
//
// Icons come from @expo/vector-icons (Ionicons) — bundled with Expo, renders
// identically on iOS, Android and web via expo-font, so it doesn't trade away
// the cross-platform simplicity that made emoji tempting in the first place
// (CLAUDE.md §41) while looking like a designed icon set instead of a font
// glyph. Filled variant for the active tab, outline for inactive.
const TAB_ICONS = {
  index: { filled: 'home', outline: 'home-outline' },
  'my-quizzes': { filled: 'document-text', outline: 'document-text-outline' },
  suggestions: { filled: 'bulb', outline: 'bulb-outline' },
  profile: { filled: 'person', outline: 'person-outline' },
} as const;

function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof TAB_ICONS;
  focused: boolean;
  color: ColorValue;
}) {
  const icon = TAB_ICONS[name];
  return <Ionicons name={focused ? icon.filled : icon.outline} size={24} color={color} />;
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
          tabBarIcon: ({ focused, color }) => <TabIcon name="index" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-quizzes"
        options={{
          title: 'Mes devoirs',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="my-quizzes" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="suggestions"
        options={{
          title: 'Suggestions',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="suggestions" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => <TabIcon name="profile" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
