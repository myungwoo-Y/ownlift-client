import { Stack } from "expo-router";
import { Platform } from "react-native";
import { colors } from "../../../src/design/tokens";
import { t, useLocale } from "../../../src/i18n";

const screenOptions = {
  contentStyle: { backgroundColor: colors.background },
  headerLargeTitleShadowVisible: false,
  headerLargeTitleStyle: { color: colors.text, fontWeight: "800" as const },
  headerShadowVisible: true,
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text },
};

export default function HistoryStackLayout() {
  useLocale();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerLargeTitle: Platform.OS === "ios",
          title: t("history.title"),
        }}
      />
    </Stack>
  );
}
