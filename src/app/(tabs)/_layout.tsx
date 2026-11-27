import { colors, text } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router/js-tabs';
import { type ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: {
  name: string;
  title: string;
  icon: ComponentProps<typeof Feather>['name'];
}[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'insurance', title: 'Insurance', icon: 'shield' },
  { name: 'policies', title: 'Policies', icon: 'file' },
  { name: 'rewards', title: 'Rewards', icon: 'gift' },
  { name: 'more', title: 'More', icon: 'user' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Devices with no home indicator report a 0 inset; keep some breathing room.
  const bottom = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: text.tabLabel,
        tabBarStyle: {
          height: 62 + bottom,
          paddingTop: 10,
          paddingBottom: bottom,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          // Spec: no shadows anywhere. Android adds one to the bar by default.
          elevation: 0,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Feather
                name={tab.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
