import { getSetting, runMigrations, setDatabase } from "@ownlift/db";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { openDatabaseAsync } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useProgramStore } from "../src/stores/program-store";
import { useSettingsStore } from "../src/stores/settings-store";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Open DB & run migrations
        const db = await openDatabaseAsync("ownlift.db");
        setDatabase(db);
        await runMigrations(db);

        // 2. Check if onboarding is complete
        const onboardingDone = await getSetting("onboarding_complete");
        setNeedsOnboarding(onboardingDone !== "true");

        // 3. Load stores
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

    const inOnboarding = segments[0] === "(onboarding)";

    if (needsOnboarding && !inOnboarding) {
      router.replace("/(onboarding)");
    } else if (!needsOnboarding && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isReady, needsOnboarding, segments, router]);

  if (!isReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="workout/[sessionId]"
        options={{ presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="session/[sessionId]"
        options={{ presentation: "card" }}
      />
    </Stack>
  );
}
