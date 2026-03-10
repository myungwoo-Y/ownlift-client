import { setSetting } from "@ownlift/db";
import type { MainLift, ProgramParams, RoundingMode, WeightUnit } from "@ownlift/schemas";
import { DEFAULT_SETTINGS } from "@ownlift/schemas";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, colors, Divider, Section, spacing, Text } from "../../src/design";
import { getLiftLabel, t, useLocale } from "../../src/i18n";
import { useProgramStore } from "../../src/stores/program-store";

export default function OnboardingStep3() {
  useLocale();

  const router = useRouter();
  const params = useLocalSearchParams<{
    unit: WeightUnit;
    roundingMode: RoundingMode;
    squat: string;
    bench: string;
    deadlift: string;
    press: string;
    tmIncUpper: string;
    tmIncLower: string;
  }>();

  const [includeDeload, setIncludeDeload] = useState(true);
  const [warmUpEnabled, setWarmUpEnabled] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const unit = params.unit ?? "kg";
  const roundingMode = (params.roundingMode ?? "nearest") as RoundingMode;
  const roundingIncrement = unit === "kg"
    ? DEFAULT_SETTINGS.roundingIncrement.kg
    : DEFAULT_SETTINGS.roundingIncrement.lb;

  const handleFinish = async () => {
    setIsCreating(true);

    try {
      const programParams: ProgramParams = {
        trainingMaxes: {
          squat: parseFloat(params.squat ?? "0"),
          bench: parseFloat(params.bench ?? "0"),
          deadlift: parseFloat(params.deadlift ?? "0"),
          press: parseFloat(params.press ?? "0"),
        },
        unit,
        roundingIncrement,
        roundingMode,
        tmIncreaseUpper: parseFloat(params.tmIncUpper ?? "2.5"),
        tmIncreaseLower: parseFloat(params.tmIncLower ?? "5"),
        liftOrder: ["squat", "bench", "deadlift", "press"] as MainLift[],
        warmUpEnabled,
        includeDeload,
      };

      await useProgramStore.getState().initProgram(programParams);
      await setSetting({ key: "onboarding_complete", value: "true" });
      await setSetting({ key: "includeDeload", value: String(includeDeload) });
      await setSetting({ key: "warmUpEnabled", value: String(warmUpEnabled) });

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to finish onboarding:", error);
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="title">{t("onboarding.step3.title")}</Text>
          <Text variant="caption">{t("onboarding.step3.subtitle")}</Text>
        </View>

        <Section title={t("onboarding.section.programOptions")}>
          <View style={styles.row}>
            <View style={styles.rowTextContainer}>
              <Text variant="body">{t("settings.deloadWeek")}</Text>
              <Text variant="caption">{t("settings.deloadHint")}</Text>
            </View>
            <Switch
              value={includeDeload}
              onValueChange={setIncludeDeload}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={includeDeload ? colors.accentForeground : colors.surfaceElevated}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextContainer}>
              <Text variant="body">{t("onboarding.warmupSets")}</Text>
              <Text variant="caption">{t("onboarding.warmupHint")}</Text>
            </View>
            <Switch
              value={warmUpEnabled}
              onValueChange={setWarmUpEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={warmUpEnabled ? colors.accentForeground : colors.surfaceElevated}
            />
          </View>
        </Section>

        <Divider />

        <Section title={t("onboarding.section.liftOrder")}>
          {(["squat", "bench", "deadlift", "press"] as const).map((lift, i) => (
            <View key={lift} style={styles.liftOrderRow}>
              <Text style={styles.liftOrderIndex}>{String(i + 1)}</Text>
              <Text variant="body" style={styles.liftOrderName}>
                {getLiftLabel(lift)}
              </Text>
            </View>
          ))}
          <Text variant="caption">
            {t("onboarding.liftOrderHint")}
          </Text>
        </Section>

        <View style={styles.spacer} />

        <Button
          title={isCreating ? t("onboarding.creatingProgram") : t("onboarding.startProgram")}
          disabled={isCreating}
          onPress={handleFinish}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing["2xl"],
    gap: spacing["2xl"],
    flexGrow: 1,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing["3xl"],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  rowTextContainer: {
    flex: 1,
    gap: 2,
  },
  liftOrderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  liftOrderIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    textAlign: "center",
    lineHeight: 24,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    overflow: "hidden",
  },
  liftOrderName: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
