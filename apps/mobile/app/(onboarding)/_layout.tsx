import { Stack } from "expo-router";
import { colors } from "../../src/design/tokens";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="training-max" />
      <Stack.Screen name="customize" />
    </Stack>
  );
}
