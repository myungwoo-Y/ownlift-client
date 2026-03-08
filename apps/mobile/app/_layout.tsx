import { getSetting, runMigrations, setDatabase } from "@ownlift/db";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { openDatabaseAsync } from "expo-sqlite";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLocale } from "../src/i18n";
import { useProgramStore } from "../src/stores/program-store";
import { useSettingsStore } from "../src/stores/settings-store";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useLocale();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, freezeOnBlur: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="workout/[sessionId]"
            options={{ presentation: "card", freezeOnBlur: false }}
          />
          <Stack.Screen
            name="session/[sessionId]"
            options={{ presentation: "card", freezeOnBlur: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
