import type { RoundingMode, WeightUnit } from "@ownlift/schemas";
import { DEFAULT_SETTINGS } from "@ownlift/schemas";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Divider, Section, SegmentedControl, Text, colors, spacing } from "../../src/design";
import { getRoundingModeLabel, t, useLocale } from "../../src/i18n";

export default function OnboardingStep1() {
  useLocale();

  const router = useRouter();
  const [unit, setUnit] = useState<WeightUnit>(DEFAULT_SETTINGS.unit);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>(DEFAULT_SETTINGS.roundingMode);
  const roundingModes: readonly RoundingMode[] = ["nearest", "down", "up"];

  const roundingIncrement = unit === "kg"
    ? DEFAULT_SETTINGS.roundingIncrement.kg
    : DEFAULT_SETTINGS.roundingIncrement.lb;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="title">{t("onboarding.step1.title")}</Text>
          <Text variant="subtitle">{t("onboarding.step1.subtitle")}</Text>
        </View>

        <Section title={t("onboarding.section.weightUnit")}>
          <SegmentedControl
            options={["kg", "lb"]}
            selectedIndex={unit === "kg" ? 0 : 1}
            onSelect={(i) => setUnit(i === 0 ? "kg" : "lb")}
          />
          <Text variant="caption">
            {t("onboarding.roundingSummary", {
              increment: roundingIncrement,
              unit,
              mode: getRoundingModeLabel(roundingMode),
            })}
          </Text>
        </Section>

        <Divider />

        <Section title={t("onboarding.section.roundingMode")}>
          <SegmentedControl
            options={roundingModes.map((mode) => getRoundingModeLabel(mode))}
            selectedIndex={roundingModes.indexOf(roundingMode)}
            onSelect={(i) =>
              setRoundingMode(roundingModes[i] ?? "nearest")
            }
          />
        </Section>

        <View style={styles.spacer} />

        <Button
          title={t("onboarding.nextTrainingMaxes")}
          onPress={() =>
            router.push({
              pathname: "/(onboarding)/training-max",
              params: { unit, roundingMode },
            })
          }
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
  spacer: {
    flex: 1,
  },
});
