import { Stack } from "expo-router";
import { Platform } from "react-native";
import { colors } from "../../../src/design/tokens";
import { t, useLocale } from "../../../src/i18n";

const screenOptions = {
  headerLargeTitleShadowVisible: false,
  headerLargeTitleStyle: { color: colors.text, fontWeight: "800" as const },
  headerTransparent: Platform.OS === "ios",
  headerTitleStyle: { color: colors.text },
};

export default function PlanStackLayout() {
  useLocale();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerLargeTitle: true,
          title: t("tab.plan"),
        }}
      />
      <Stack.Screen
        name="reorder"
        options={{
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: t("plan.editWeek"),
        }}
      />
    </Stack>
  );
}
