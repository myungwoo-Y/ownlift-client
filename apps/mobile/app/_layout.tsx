import { getSetting, runMigrations, setDatabase } from "@ownlift/db";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { openDatabaseAsync } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Appearance, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../src/design/tokens";
import { useLocale } from "../src/i18n";
import { useProgramStore } from "../src/stores/program-store";
import { useSettingsStore } from "../src/stores/settings-store";

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    notification: colors.primary,
    primary: colors.primary,
    text: colors.text,
  },
};

export default function RootLayout() {
  useLocale();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    Appearance.setColorScheme("dark");
    void SystemUI.setBackgroundColorAsync(colors.background);

    async function bootstrap() {
      try {
        // 1. Open DB & run migrations
        const db = await openDatabaseAsync("ownlift.db");
        setDatabase(db);
        await runMigrations(db);

        // 2. Load stores
        await useSettingsStore.getState().loadSettings();
        await useProgramStore.getState().loadProgram();

        setIsReady(true);
      } catch (error) {
        console.error("Bootstrap failed:", error);
        setIsReady(true);
      }
    }

    bootstrap();
  }, []);

  // Handle navigation after ready
  useEffect(() => {
    if (!isReady) return;

    void SplashScreen.hideAsync();
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;

    let isCancelled = false;

    async function syncNavigation() {
      const onboardingDone = await getSetting("onboarding_complete");
      if (isCancelled) return;
      const needsOnboarding = onboardingDone !== "true";
      const inOnboarding = segments[0] === "(onboarding)";

      if (needsOnboarding && !inOnboarding) {
        router.replace("/(onboarding)");
      } else if (!needsOnboarding && inOnboarding) {
        router.replace("/(tabs)");
      }
    }

    void syncNavigation();

    return () => {
      isCancelled = true;
    };
  }, [isReady, segments, router]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.stackContent,
            }}
          >
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="workout/[sessionId]"
              options={{
                presentation: "card",
                contentStyle: styles.stackContent,
              }}
            />
            <Stack.Screen
              name="session/[sessionId]"
              options={{
                presentation: "card",
                contentStyle: styles.stackContent,
              }}
            />
            <Stack.Screen
              name="upcoming"
              options={{
                presentation: "card",
                contentStyle: styles.stackContent,
              }}
            />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stackContent: {
    backgroundColor: colors.background,
  },
});
