import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../src/design/tokens";
import { t, useLocale } from "../../src/i18n";
import { FitnessTabBar } from "../../src/navigation/FitnessTabBar";

export default function TabLayout() {
  const locale = useLocale();

  return (
    <Tabs
      key={locale}
      tabBar={(props) => <FitnessTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.plan"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("tab.history"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tab.settings"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
